import { ArrowUpRight } from 'lucide-react';
import { CATEGORIES, type CategoryId, type PlatformStatsDTO } from '../shared/types.ts';

interface CategoriesViewProps {
  stats: PlatformStatsDTO | null;
  onSelectCategory: (category: CategoryId) => void;
  onCreateInCategory: (category: CategoryId) => void;
}

export function CategoriesView({
  stats,
  onSelectCategory,
  onCreateInCategory,
}: CategoriesViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111210] [text-wrap:balance]">
          Fikir ve Tartışma Kategorileri
        </h1>
        <p className="mt-3 text-base text-[#4E5048]">
          İlgi alanına veya aklındaki kararsızlığa göre bir kategori seç, topluluk
          görüşlerini incele ya da doğrudan yeni bir başlık aç.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((category, index) => {
          const count = stats?.categoryCounts[category.id] ?? 0;
          const indexLabel = String(index + 1).padStart(2, '0');

          return (
            <div
              key={category.id}
              className="flex flex-col justify-between rounded-2xl border border-[#DFDDD2] bg-white p-6 transition-colors hover:border-[#111210]/45"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-[#5A5C53]">
                  <span className="font-mono tabular-nums">{indexLabel}.</span>
                  <span className="font-mono tabular-nums text-[#111210]">
                    {count} soru
                  </span>
                </div>

                <h2 className="mt-3 font-display text-xl font-bold text-[#111210]">
                  {category.label}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#4E5048]">
                  {category.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#ECEAE1] pt-4">
                <button
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#111210] px-3.5 py-2 text-xs font-semibold text-[#D4FF00] transition-colors hover:bg-[#262822] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Soruları Gör</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onCreateInCategory(category.id)}
                  className="inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-xs font-semibold text-[#4A4B44] transition-colors hover:bg-[#F5F4EE] hover:text-[#111210] cursor-pointer whitespace-nowrap shrink-0"
                >
                  Bu Alanda Sor
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
