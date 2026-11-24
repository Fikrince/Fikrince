import { ArrowRight, Check } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CategoriesView } from './components/CategoriesView.tsx';
import { CreateQuestionModal } from './components/CreateQuestionModal.tsx';
import { ExploreSection } from './components/ExploreSection.tsx';
import { FikrinceLogo } from './components/FikrinceLogo.tsx';
import { Header, type AppView } from './components/Header.tsx';
import { QuestionDetailView } from './components/QuestionDetailView.tsx';
import { QuestionForm } from './components/QuestionForm.tsx';
import { QuestionDetailSkeleton } from './components/QuestionSkeleton.tsx';
import { fikrinceApi } from './services/api.ts';
import type {
  CategoryId,
  PlatformStatsDTO,
  QuestionDetailDTO,
  QuestionDTO,
  QuestionSort,
} from './shared/types.ts';
import { copyTextToClipboard } from './utils/format.ts';

function parseRouteFromLocation(): {
  view: AppView;
  questionIdOrSlug: string | null;
} {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/soru/')) {
    const slug = decodeURIComponent(pathname.slice('/soru/'.length)).replace(
      /\/+$/,
      ''
    );
    if (slug) {
      return { view: 'detail', questionIdOrSlug: slug };
    }
  }
  if (pathname === '/kesfet') {
    return { view: 'explore', questionIdOrSlug: null };
  }
  if (pathname === '/kategoriler') {
    return { view: 'categories', questionIdOrSlug: null };
  }
  return { view: 'home', questionIdOrSlug: null };
}

export default function App() {
  const initialRoute = parseRouteFromLocation();
  const [view, setView] = useState<AppView>(initialRoute.view);
  const [activeSlug, setActiveSlug] = useState<string | null>(
    initialRoute.questionIdOrSlug
  );

  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [activeQuestion, setActiveQuestion] = useState<QuestionDetailDTO | null>(
    null
  );
  const [detailLoading, setDetailLoading] = useState(
    initialRoute.view === 'detail'
  );
  const [detailError, setDetailError] = useState<string | null>(null);

  const [stats, setStats] = useState<PlatformStatsDTO | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<QuestionSort>('newest');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalDefaultCategory, setModalDefaultCategory] =
    useState<CategoryId>('teknoloji');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fikrinceApi.getStats();
      setStats(data);
    } catch {
      // Non-blocking stats load
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const list = await fikrinceApi.listQuestions({
        category: selectedCategory,
        search: debouncedSearch,
        sort: sortBy,
      });
      setQuestions(list);
    } catch (err) {
      setQuestionsError(
        err instanceof Error ? err.message : 'Sorular yüklenemedi.'
      );
    } finally {
      setQuestionsLoading(false);
    }
  }, [selectedCategory, debouncedSearch, sortBy]);

  const loadQuestionDetail = useCallback(async (slugOrId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await fikrinceApi.getQuestion(slugOrId);
      setActiveQuestion(detail);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Soru bulunamadı veya kaldırıldı.'
      );
      setActiveQuestion(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (view === 'detail' && activeSlug) {
      loadQuestionDetail(activeSlug);
    }
  }, [view, activeSlug, loadQuestionDetail]);

  // Sync browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseRouteFromLocation();
      setView(parsed.view);
      setActiveSlug(parsed.questionIdOrSlug);
      if (parsed.view !== 'detail') {
        setActiveQuestion(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (
    targetView: 'home' | 'explore' | 'categories',
    push = true
  ) => {
    const pathMap = {
      home: '/',
      explore: '/kesfet',
      categories: '/kategoriler',
    };
    if (push && window.location.pathname !== pathMap[targetView]) {
      window.history.pushState({}, '', pathMap[targetView]);
    }
    setView(targetView);
    setActiveSlug(null);
    setActiveQuestion(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openQuestionDetail = (question: QuestionDTO | QuestionDetailDTO) => {
    const slugOrId = question.slug || question.id;
    const targetUrl = `/soru/${encodeURIComponent(slugOrId)}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    setActiveSlug(slugOrId);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuestionCreated = (created: QuestionDetailDTO) => {
    setCreateModalOpen(false);
    setQuestions((prev) => [created, ...prev]);
    setActiveQuestion(created);
    loadStats();
    openQuestionDetail(created);
    showToast('Fikrin toplulukla paylaşıldı.');
  };

  const handleToggleQuestionLike = async (questionId: string) => {
    try {
      const updated = await fikrinceApi.toggleQuestionLike(questionId);
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? updated : q))
      );
      if (activeQuestion && activeQuestion.id === questionId) {
        setActiveQuestion({ ...activeQuestion, ...updated });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'İşlem tamamlanamadı.');
    }
  };

  const handleShareQuestion = async (question: QuestionDTO) => {
    const permalink = `${window.location.origin}/soru/${encodeURIComponent(
      question.slug || question.id
    )}`;
    const ok = await copyTextToClipboard(permalink);
    if (ok) {
      showToast('Soru bağlantısı panoya kopyalandı.');
    } else {
      showToast('Bağlantı kopyalanamadı.');
    }
  };

  const handleDetailUpdated = (updated: QuestionDetailDTO) => {
    setActiveQuestion(updated);
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === updated.id
          ? {
              ...q,
              likesCount: updated.likesCount,
              userLiked: updated.userLiked,
              answersCount: updated.answersCount,
            }
          : q
      )
    );
    loadStats();
  };

  const openCreateModal = (cat?: CategoryId) => {
    if (cat) setModalDefaultCategory(cat);
    setCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4EE] text-[#111210]">
      <Header
        activeView={view}
        onNavigate={(target) => navigateTo(target)}
        onOpenCreate={() => openCreateModal()}
      />

      <main className="flex-1">
        {view === 'home' && (
          <>
            {/* Editorial Charcoal Hero + Inline Quick Composer */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10">
              <div className="rounded-3xl bg-[#111210] text-[#F5F4EE] p-6 sm:p-10 lg:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                  {/* Left Brand & Slogan Column */}
                  <div className="lg:col-span-6 flex flex-col justify-between">
                    <div>
                      <FikrinceLogo tone="light" size="lg" />

                      <h1 className="mt-7 font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-[#F5F4EE] [text-wrap:balance]">
                        Bir fikrin varsa,{' '}
                        <span className="text-[#D4FF00]">yalnız değilsin.</span>
                      </h1>

                      <p className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-[#C7C8BF]">
                        Aklındaki soruları, ikilemleri ve yeni fikirleri paylaş.
                        Farklı deneyimlere sahip insanların gerçek görüşleriyle
                        daha net karar ver.
                      </p>

                      <div className="mt-7 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => navigateTo('explore')}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#D4FF00] px-5 py-2.5 text-sm font-bold text-[#111210] transition-colors hover:bg-[#C6F000] active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>Fikirleri Keşfet</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateTo('categories')}
                          className="inline-flex min-h-[44px] items-center rounded-xl border border-[#2F312B] bg-[#1A1C18] px-5 py-2.5 text-sm font-semibold text-[#F5F4EE] transition-colors hover:border-[#D4FF00]/60 hover:text-[#D4FF00] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Kategorilere Bak
                        </button>
                      </div>
                    </div>

                    {/* Clean Unboxed Typographic Community Proof Strip */}
                    <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#262822] pt-6 text-xs sm:text-sm text-[#A9ABA1]">
                      <span>
                        <strong className="font-mono tabular-nums text-[#F5F4EE] font-semibold">
                          {stats ? stats.totalQuestions : questions.length}
                        </strong>{' '}
                        Açık Soru
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        <strong className="font-mono tabular-nums text-[#F5F4EE] font-semibold">
                          {stats ? stats.totalAnswers : '—'}
                        </strong>{' '}
                        Topluluk Görüşü
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        <strong className="font-mono tabular-nums text-[#F5F4EE] font-semibold">
                          6
                        </strong>{' '}
                        Temel Kategori
                      </span>
                    </div>
                  </div>

                  {/* Right Inline Share Question Card */}
                  <div className="lg:col-span-6 flex">
                    <div className="w-full rounded-2xl bg-white text-[#111210] p-5 sm:p-7 flex flex-col justify-center">
                      <div className="mb-4 pb-3 border-b border-[#ECEAE1]">
                        <h2 className="font-display text-lg sm:text-xl font-bold text-[#111210]">
                          Hemen Bir Fikir veya Soru Paylaş
                        </h2>
                        <p className="mt-0.5 text-xs sm:text-sm text-[#5A5C53]">
                          Üyelik gerekmez. Başlığını yaz, kategorini seç ve yayınla.
                        </p>
                      </div>

                      <QuestionForm
                        compact
                        onCreated={handleQuestionCreated}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Live Community Feed */}
            <ExploreSection
              title="Topluluktan Güncel Sorular"
              subtitle="İnsanların şu an tartıştığı konulara katıl, görüş yaz ve en faydalı cevapları oyla."
              questions={questions}
              loading={questionsLoading}
              error={questionsError}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              sortBy={sortBy}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setSearchQuery}
              onSortChange={setSortBy}
              onRetry={loadQuestions}
              onOpenQuestion={openQuestionDetail}
              onToggleLike={handleToggleQuestionLike}
              onShare={handleShareQuestion}
              onOpenCreate={() => openCreateModal()}
            />
          </>
        )}

        {view === 'explore' && (
          <ExploreSection
            title="Keşfet"
            subtitle="Tüm kategorilerdeki soruları filtrele, ara ve görüşlerini paylaş."
            questions={questions}
            loading={questionsLoading}
            error={questionsError}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            sortBy={sortBy}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
            onRetry={loadQuestions}
            onOpenQuestion={openQuestionDetail}
            onToggleLike={handleToggleQuestionLike}
            onShare={handleShareQuestion}
            onOpenCreate={() => openCreateModal()}
          />
        )}

        {view === 'categories' && (
          <CategoriesView
            stats={stats}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              navigateTo('explore');
            }}
            onCreateInCategory={(cat) => openCreateModal(cat)}
          />
        )}

        {view === 'detail' && (
          <>
            {detailLoading ? (
              <QuestionDetailSkeleton />
            ) : detailError || !activeQuestion ? (
              <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
                <div className="rounded-2xl border border-[#DFDDD2] bg-white p-8 sm:p-10">
                  <h1 className="font-display text-2xl font-bold text-[#111210]">
                    Soru bulunamadı
                  </h1>
                  <p className="mt-2 text-sm text-[#5A5C53]">
                    {detailError ||
                      'Aradığın soru bağlantısı geçersiz veya kaldırılmış olabilir.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('explore')}
                    className="mt-6 min-h-[44px] rounded-xl bg-[#111210] px-6 py-2.5 text-sm font-semibold text-[#D4FF00] hover:bg-[#262822] transition-colors cursor-pointer"
                  >
                    Keşfet Sayfasına Dön
                  </button>
                </div>
              </div>
            ) : (
              <QuestionDetailView
                question={activeQuestion}
                onBack={() => navigateTo('explore')}
                onQuestionUpdated={handleDetailUpdated}
                onShare={handleShareQuestion}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-16 border-t border-[#E3E1D7] bg-[#F5F4EE]">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-8">
          <div className="flex flex-col gap-1">
            <FikrinceLogo tone="dark" size="sm" />
            <p className="text-xs text-[#5A5C53]">
              Bir fikrin varsa, yalnız değilsin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#4E5048]">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="hover:text-[#111210] transition-colors cursor-pointer"
            >
              Ana Sayfa
            </button>
            <button
              type="button"
              onClick={() => navigateTo('explore')}
              className="hover:text-[#111210] transition-colors cursor-pointer"
            >
              Keşfet
            </button>
            <button
              type="button"
              onClick={() => navigateTo('categories')}
              className="hover:text-[#111210] transition-colors cursor-pointer"
            >
              Kategoriler
            </button>
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="font-semibold text-[#111210] hover:underline cursor-pointer"
            >
              Fikir Paylaş
            </button>
          </div>
        </div>
      </footer>

      <CreateQuestionModal
        open={createModalOpen}
        defaultCategory={modalDefaultCategory}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleQuestionCreated}
      />

      {/* Non-intrusive Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-xl bg-[#111210] px-4 py-3 text-xs sm:text-sm font-semibold text-[#D4FF00] shadow-lg"
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
