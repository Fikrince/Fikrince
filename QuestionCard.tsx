import { ArrowUpRight, Check, Heart, MessageSquare, Share2 } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { getCategoryLabel, type QuestionDTO } from '../shared/types.ts';
import { formatRelativeTimeTr } from '../utils/format.ts';

interface QuestionCardProps {
  question: QuestionDTO;
  onOpen: (question: QuestionDTO) => void;
  onToggleLike: (questionId: string) => Promise<void>;
  onShare: (question: QuestionDTO) => Promise<void>;
}

export function QuestionCard({
  question,
  onOpen,
  onToggleLike,
  onShare,
}: QuestionCardProps) {
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLikeClick = async (e: MouseEvent) => {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      await onToggleLike(question.id);
    } finally {
      setLiking(false);
    }
  };

  const handleShareClick = async (e: MouseEvent) => {
    e.stopPropagation();
    await onShare(question);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article
      onClick={() => onOpen(question)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(question);
        }
      }}
      className="group flex flex-col justify-between rounded-2xl border border-[#E3E1D7] bg-white p-5 sm:p-6 text-left transition-colors duration-150 hover:border-[#111210]/40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111210]"
    >
      <div>
        {/* Clean unboxed typographic metadata (zero pill enclosures) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#5A5C53]">
          <span className="font-semibold text-[#111210]">
            {getCategoryLabel(question.category)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatRelativeTimeTr(question.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate max-w-[160px]">{question.author}</span>
        </div>

        <h3 className="mt-3 font-display text-lg sm:text-xl font-bold leading-snug text-[#111210] group-hover:text-[#2D2F29] transition-colors">
          {question.title}
        </h3>

        {question.description && (
          <p className="mt-2.5 text-sm leading-relaxed text-[#4E5048] line-clamp-2">
            {question.description}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#ECEAE1] pt-3.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={liking}
            aria-pressed={question.userLiked}
            aria-label={`Bu fikri beğen (${question.likesCount})`}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#111210] ${
              question.userLiked
                ? 'bg-[#111210] text-[#D4FF00]'
                : 'bg-[#F5F4EE] text-[#3E403A] hover:bg-[#EAE8DF] hover:text-[#111210]'
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${question.userLiked ? 'fill-[#D4FF00]' : ''}`}
            />
            <span className="font-mono tabular-nums">{question.likesCount}</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(question);
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#F5F4EE] px-3 py-1.5 text-xs font-semibold text-[#3E403A] transition-colors duration-150 hover:bg-[#EAE8DF] hover:text-[#111210] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#111210]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{question.answersCount}</span>
            <span>Görüş</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShareClick}
            aria-label="Soru bağlantısını paylaş"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#5A5C53] transition-colors duration-150 hover:bg-[#F5F4EE] hover:text-[#111210] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#111210]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#111210]" />
                <span className="text-[#111210] font-semibold">Kopyalandı</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Paylaş</span>
              </>
            )}
          </button>

          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#787A70] group-hover:text-[#111210] transition-colors"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
