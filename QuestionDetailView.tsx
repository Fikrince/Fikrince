import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Heart,
  Link2,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  getCategoryLabel,
  type AnswerDTO,
  type AnswerSort,
  type QuestionDetailDTO,
} from '../shared/types.ts';
import { fikrinceApi, getSavedAuthorAlias, saveAuthorAlias } from '../services/api.ts';
import { formatFullDateTr, formatRelativeTimeTr } from '../utils/format.ts';

interface QuestionDetailViewProps {
  question: QuestionDetailDTO;
  onBack: () => void;
  onQuestionUpdated: (updated: QuestionDetailDTO) => void;
  onShare: (question: QuestionDetailDTO) => Promise<void>;
}

export function QuestionDetailView({
  question,
  onBack,
  onQuestionUpdated,
  onShare,
}: QuestionDetailViewProps) {
  const [answerText, setAnswerText] = useState('');
  const [author, setAuthor] = useState(() => getSavedAuthorAlias());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<AnswerSort>('top');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const encodedSlugOrId = encodeURIComponent(question.slug || question.id);
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/soru/${encodedSlugOrId}`
      : `/soru/${encodedSlugOrId}`;

  const sortedAnswers = useMemo(() => {
    const list = [...question.answers];
    if (sortBy === 'newest') {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      list.sort((a, b) => {
        if (b.voteScore !== a.voteScore) return b.voteScore - a.voteScore;
        if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return list;
  }, [question.answers, sortBy]);

  const handleToggleQuestionLike = async () => {
    if (busyIds[question.id]) return;
    setBusyIds((prev) => ({ ...prev, [question.id]: true }));
    try {
      const updated = await fikrinceApi.toggleQuestionLike(question.id);
      onQuestionUpdated({
        ...question,
        ...updated,
      });
    } finally {
      setBusyIds((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  const handleAnswerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = answerText.trim();
    if (trimmed.length < 2) {
      setFormError('Görüşün en az 2 karakter olmalıdır.');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      saveAuthorAlias(author);
      const created = await fikrinceApi.createAnswer(question.id, {
        content: trimmed,
        author: author.trim() || 'Anonim',
      });
      setAnswerText('');
      onQuestionUpdated({
        ...question,
        answersCount: question.answersCount + 1,
        answers: [created, ...question.answers],
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Görüş kaydedilirken hata oluştu.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateAnswerInState = (updatedAnswer: AnswerDTO) => {
    onQuestionUpdated({
      ...question,
      answers: question.answers.map((a) =>
        a.id === updatedAnswer.id ? updatedAnswer : a
      ),
    });
  };

  const handleVoteAnswer = async (answerId: string, value: -1 | 1) => {
    const key = `vote-${answerId}`;
    if (busyIds[key]) return;
    setBusyIds((prev) => ({ ...prev, [key]: true }));
    try {
      const updated = await fikrinceApi.voteAnswer(answerId, value);
      updateAnswerInState(updated);
    } finally {
      setBusyIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleLikeAnswer = async (answerId: string) => {
    const key = `like-${answerId}`;
    if (busyIds[key]) return;
    setBusyIds((prev) => ({ ...prev, [key]: true }));
    try {
      const updated = await fikrinceApi.toggleAnswerLike(answerId);
      updateAnswerInState(updated);
    } finally {
      setBusyIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleCopyLink = async () => {
    await onShare(question);
    setCopiedLink(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareClick = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: question.title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        // Fallback to clipboard copy if Web Share is blocked (e.g. inside iframe)
      }
    }

    await onShare(question);
    setCopiedShare(true);
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#3E403A] transition-colors hover:bg-[#EAE8DF] hover:text-[#111210] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#111210]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tüm Sorulara Dön</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Bağlantıyı Kopyala"
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#111210] ${
              copiedLink
                ? 'border-[#111210] bg-[#111210] text-[#D4FF00]'
                : 'border-[#D8D6CB] bg-white text-[#111210] hover:border-[#111210]'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Bağlantı Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Bağlantıyı Kopyala</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D8D6CB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#111210] transition-colors hover:border-[#111210] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#111210]"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Bağlantı Kopyalandı</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Paylaş</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Question Card */}
      <article className="rounded-2xl border border-[#DFDDD2] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#5A5C53]">
          <span className="font-semibold text-[#111210]">
            {getCategoryLabel(question.category)}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={question.createdAt} title={formatFullDateTr(question.createdAt)}>
            {formatRelativeTimeTr(question.createdAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{question.author}</span>
        </div>

        <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold leading-tight text-[#111210] [text-wrap:balance]">
          {question.title}
        </h1>

        {question.description && (
          <p className="mt-4 text-base leading-relaxed text-[#383A33] whitespace-pre-line">
            {question.description}
          </p>
        )}

        {/* Question Action & Permalink Bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#ECEAE1] pt-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleQuestionLike}
              aria-pressed={question.userLiked}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                question.userLiked
                  ? 'bg-[#111210] text-[#D4FF00]'
                  : 'bg-[#F5F4EE] text-[#111210] hover:bg-[#E7E5DC]'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${question.userLiked ? 'fill-[#D4FF00]' : ''}`}
              />
              <span>Katılıyorum</span>
              <span className="font-mono tabular-nums">{question.likesCount}</span>
            </button>

            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5A5C53] whitespace-nowrap">
              <MessageSquare className="h-4 w-4" />
              <span className="font-mono tabular-nums">{question.answersCount}</span>
              <span>Görüş</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="hidden md:inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#ECEAE1] bg-[#F5F4EE] px-3 py-2 text-xs text-[#5A5C53]"
              title={shareUrl}
            >
              <Link2 className="h-3.5 w-3.5 shrink-0 text-[#787A70]" />
              <span className="truncate max-w-[220px] font-mono select-all">
                {shareUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Tartışma bağlantısını kopyala"
              title="Bu tartışmanın bağlantısını kopyala"
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#111210] ${
                copiedLink
                  ? 'border-[#111210] bg-[#111210] text-[#D4FF00]'
                  : 'border-[#D8D6CB] bg-[#F5F4EE] text-[#111210] hover:border-[#111210] hover:bg-[#EAE8DF]'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span>Bağlantı Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 shrink-0" />
                  <span>Bağlantıyı Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Answer Composer */}
      <section className="mt-6 rounded-2xl border border-[#DFDDD2] bg-white p-6 sm:p-7">
        <h2 className="font-display text-lg font-bold text-[#111210]">
          Görüşünü Paylaş
        </h2>
        <p className="mt-1 text-sm text-[#5A5C53]">
          Deneyimini, önerini veya farklı bakış açını toplulukla paylaş.
        </p>

        <form onSubmit={handleAnswerSubmit} className="mt-4 space-y-4" noValidate>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Sen olsan nasıl düşünürdün veya ne önerirsin?"
            aria-label="Görüşünüz"
            className="w-full rounded-xl border border-[#D8D6CB] bg-[#F5F4EE] px-4 py-3 text-sm sm:text-base text-[#111210] placeholder:text-[#787A70] focus:border-[#111210] focus:bg-white focus:outline-none transition-colors resize-y"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={40}
                placeholder="Adın veya takma adın (Anonim)"
                aria-label="Adınız"
                className="w-full min-h-[44px] rounded-xl border border-[#D8D6CB] bg-[#F5F4EE] px-3.5 py-2 text-sm text-[#111210] placeholder:text-[#787A70] focus:border-[#111210] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] rounded-xl bg-[#D4FF00] px-6 py-2.5 text-sm font-bold text-[#111210] transition-colors hover:bg-[#C6F000] active:scale-[0.98] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111210]"
            >
              {submitting ? 'Gönderiliyor...' : 'Görüşünü Yayınla'}
            </button>
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-[#B91C1C]">
              {formError}
            </p>
          )}
        </form>
      </section>

      {/* Answers List */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl font-bold text-[#111210]">
            Topluluk Görüşleri{' '}
            <span className="font-mono tabular-nums text-base font-medium text-[#5A5C53]">
              ({sortedAnswers.length})
            </span>
          </h2>

          <div
            role="group"
            aria-label="Görüşleri sırala"
            className="inline-flex items-center gap-1 rounded-xl bg-[#EAE8DF] p-1"
          >
            <button
              type="button"
              onClick={() => setSortBy('top')}
              className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sortBy === 'top'
                  ? 'bg-[#111210] text-[#D4FF00]'
                  : 'text-[#4A4B44] hover:text-[#111210]'
              }`}
            >
              En Çok Oylanan
            </button>
            <button
              type="button"
              onClick={() => setSortBy('newest')}
              className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-[#111210] text-[#D4FF00]'
                  : 'text-[#4A4B44] hover:text-[#111210]'
              }`}
            >
              En Yeni
            </button>
          </div>
        </div>

        {sortedAnswers.length === 0 ? (
          <div className="rounded-2xl border border-[#DFDDD2] bg-white p-8 text-center">
            <p className="font-display text-lg font-semibold text-[#111210]">
              Henüz görüş yazılmamış.
            </p>
            <p className="mt-1 text-sm text-[#5A5C53]">
              İlk fikri paylaşarak tartışmayı başlatabilirsin.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAnswers.map((answer) => (
              <article
                key={answer.id}
                className="rounded-2xl border border-[#DFDDD2] bg-white p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-[#5A5C53]">
                  <span className="font-semibold text-[#111210]">{answer.author}</span>
                  <span>{formatRelativeTimeTr(answer.createdAt)}</span>
                </div>

                <p className="mt-3 text-[15px] sm:text-base leading-relaxed text-[#252621] whitespace-pre-line">
                  {answer.content}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEAE1] pt-3.5">
                  {/* Upvote / Downvote Segmented Control */}
                  <div
                    role="group"
                    aria-label="Görüşü oyla"
                    className="inline-flex items-center rounded-xl border border-[#E3E1D7] bg-[#F5F4EE] p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => handleVoteAnswer(answer.id, 1)}
                      aria-pressed={answer.userVote === 1}
                      aria-label="Faydalı oyu ver"
                      className={`inline-flex min-h-[38px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        answer.userVote === 1
                          ? 'bg-[#D4FF00] text-[#111210]'
                          : 'text-[#4A4B44] hover:bg-[#EAE8DF] hover:text-[#111210]'
                      }`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      <span>Katıl</span>
                    </button>

                    <span
                      className="min-w-[36px] px-2 text-center font-mono text-xs font-semibold tabular-nums text-[#111210]"
                      title="Net oy puanı"
                    >
                      {answer.voteScore > 0 ? `+${answer.voteScore}` : answer.voteScore}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleVoteAnswer(answer.id, -1)}
                      aria-pressed={answer.userVote === -1}
                      aria-label="Katılmıyorum oyu ver"
                      className={`inline-flex min-h-[38px] items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        answer.userVote === -1
                          ? 'bg-[#111210] text-white'
                          : 'text-[#5A5C53] hover:bg-[#EAE8DF] hover:text-[#111210]'
                      }`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Separate Beğen (Like) Toggle */}
                  <button
                    type="button"
                    onClick={() => handleLikeAnswer(answer.id)}
                    aria-pressed={answer.userLiked}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      answer.userLiked
                        ? 'bg-[#111210] text-[#D4FF00]'
                        : 'bg-[#F5F4EE] text-[#4A4B44] hover:bg-[#EAE8DF] hover:text-[#111210]'
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        answer.userLiked ? 'fill-[#D4FF00]' : ''
                      }`}
                    />
                    <span>Beğen</span>
                    <span className="font-mono tabular-nums">{answer.likesCount}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
