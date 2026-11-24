import { Search, X } from 'lucide-react';
import {
  CATEGORIES,
  type CategoryId,
  type QuestionDTO,
  type QuestionSort,
} from '../shared/types.ts';
import { QuestionCard } from './QuestionCard.tsx';
import { QuestionListSkeleton } from './QuestionSkeleton.tsx';

interface ExploreSectionProps {
  title: string;
  subtitle?: string;
  questions: QuestionDTO[];
  loading: boolean;
  error: string | null;
  selectedCategory: CategoryId | 'all';
  searchQuery: string;
  sortBy: QuestionSort;
  onCategoryChange: (cat: CategoryId | 'all') => void;
  onSearchChange: (q: string) => void;
  onSortChange: (sort: QuestionSort) => void;
  onRetry: () => void;
  onOpenQuestion: (question: QuestionDTO) => void;
  onToggleLike: (questionId: string) => Promise<void>;
  onShare: (question: QuestionDTO) => Promise<void>;
  onOpenCreate: () => void;
}

export function ExploreSection({
  title,
  subtitle,
  questions,
  loading,
  error,
  selectedCategory,
  searchQuery,
  sortBy,
  onCategoryChange,
  onSearchChange,
  onSortChange,
  onRetry,
  onOpenQuestion,
  onToggleLike,
  onShare,
  onOpenCreate,
}: ExploreSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111210]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-sm sm:text-base text-[#4E5048]">{subtitle}</p>
          )}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66685F]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Sorularda ara..."
              aria-label="Sorular arasında ara"
              className="w-full min-h-[44px] rounded-xl border border-[#D8D6CB] bg-white pl-10 pr-9 py-2 text-sm text-[#111210] placeholder:text-[#787A70] focus:border-[#111210] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Aramayı temizle"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5A5C53] hover:bg-[#F5F4EE] hover:text-[#111210] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Sıralama"
            className="inline-flex items-center gap-1 rounded-xl bg-[#EAE8DF] p-1 self-start sm:self-auto"
          >
            {(
              [
                { id: 'newest', label: 'En Yeni' },
                { id: 'popular', label: 'Öne Çıkan' },
                { id: 'discussed', label: 'Çok Görüş' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSortChange(opt.id)}
                className={`min-h-[36px] rounded-lg px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sortBy === opt.id
                    ? 'bg-[#111210] text-[#D4FF00]'
                    : 'text-[#4A4B44] hover:text-[#111210]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Kategori filtresi"
        className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          onClick={() => onCategoryChange('all')}
          className={`min-h-[40px] rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#111210] text-[#D4FF00]'
              : 'bg-[#EAE8DF] text-[#3E403A] hover:bg-[#DFDDD2] hover:text-[#111210]'
          }`}
        >
          Tümü
        </button>
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onCategoryChange(cat.id)}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#111210] text-[#D4FF00]'
                  : 'bg-[#EAE8DF] text-[#3E403A] hover:bg-[#DFDDD2] hover:text-[#111210]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results State */}
      {error ? (
        <div className="mt-8 rounded-2xl border border-[#DFDDD2] bg-white p-8 text-center">
          <p className="font-display text-lg font-bold text-[#111210]">
            Sorular yüklenemedi
          </p>
          <p className="mt-1 text-sm text-[#5A5C53]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 min-h-[42px] rounded-xl bg-[#111210] px-5 py-2 text-sm font-semibold text-[#D4FF00] hover:bg-[#262822] transition-colors cursor-pointer"
          >
            Tekrar Dene
          </button>
        </div>
      ) : loading ? (
        <QuestionListSkeleton count={6} />
      ) : questions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#DFDDD2] bg-white p-10 text-center">
          <h3 className="font-display text-xl font-bold text-[#111210]">
            Bu kriterlere uygun bir fikir bulunamadı
          </h3>
          <p className="mt-2 text-sm text-[#5A5C53]">
            Arama kelimeni değiştirebilir veya bu konuda ilk soruyu sen sorabilirsin.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  onCategoryChange('all');
                }}
                className="min-h-[44px] rounded-xl border border-[#D8D6CB] bg-[#F5F4EE] px-4 py-2 text-sm font-semibold text-[#111210] hover:bg-[#EAE8DF] transition-colors cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            )}
            <button
              type="button"
              onClick={onOpenCreate}
              className="min-h-[44px] rounded-xl bg-[#D4FF00] px-5 py-2 text-sm font-bold text-[#111210] hover:bg-[#C6F000] transition-colors cursor-pointer"
            >
              İlk Soruyu Sen Sor
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-5">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onOpen={onOpenQuestion}
              onToggleLike={onToggleLike}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </section>
  );
}
