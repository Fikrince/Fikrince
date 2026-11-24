import { motion } from 'motion/react';
import type { CSSProperties } from 'react';

interface ShimmerBlockProps {
  className: string;
  delayMs?: number;
}

function ShimmerBlock({ className, delayMs = 0 }: ShimmerBlockProps) {
  const style = {
    '--skeleton-delay': `${delayMs}ms`,
  } as CSSProperties;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`skeleton-shimmer ${className}`}
    />
  );
}

const CARD_VARIANTS = [
  { catW: 'w-20', authorW: 'w-24', title1W: 'w-[92%]', title2W: 'w-[68%]', desc2W: 'w-[78%]' },
  { catW: 'w-16', authorW: 'w-20', title1W: 'w-[86%]', title2W: 'w-[54%]', desc2W: 'w-[64%]' },
  { catW: 'w-24', authorW: 'w-28', title1W: 'w-[95%]', title2W: 'w-[72%]', desc2W: 'w-[82%]' },
  { catW: 'w-20', authorW: 'w-22', title1W: 'w-[88%]', title2W: 'w-[60%]', desc2W: 'w-[70%]' },
] as const;

interface QuestionCardSkeletonProps {
  index?: number;
}

export function QuestionCardSkeleton({ index = 0 }: QuestionCardSkeletonProps) {
  const variant = CARD_VARIANTS[index % CARD_VARIANTS.length];
  const delayMs = (index % 4) * 110;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col justify-between rounded-2xl border border-[#E3E1D7] bg-white p-5 sm:p-6"
    >
      <div>
        {/* Unboxed metadata row placeholder */}
        <div className="flex items-center gap-2">
          <ShimmerBlock className={`h-3.5 rounded-md ${variant.catW}`} delayMs={delayMs} />
          <span aria-hidden="true" className="text-xs text-[#D8D6CB]">·</span>
          <ShimmerBlock className="h-3.5 w-14 rounded-md" delayMs={delayMs + 40} />
          <span aria-hidden="true" className="text-xs text-[#D8D6CB]">·</span>
          <ShimmerBlock className={`h-3.5 rounded-md ${variant.authorW}`} delayMs={delayMs + 80} />
        </div>

        {/* Two-line title placeholder */}
        <div className="mt-3.5 space-y-2">
          <ShimmerBlock className={`h-5 rounded-lg ${variant.title1W}`} delayMs={delayMs + 60} />
          <ShimmerBlock className={`h-5 rounded-lg ${variant.title2W}`} delayMs={delayMs + 100} />
        </div>

        {/* Two-line description excerpt placeholder */}
        <div className="mt-3 space-y-1.5">
          <ShimmerBlock className="h-3.5 w-full rounded-md" delayMs={delayMs + 120} />
          <ShimmerBlock className={`h-3.5 rounded-md ${variant.desc2W}`} delayMs={delayMs + 150} />
        </div>
      </div>

      {/* Action footer placeholder */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#ECEAE1] pt-3.5">
        <div className="flex items-center gap-2">
          <ShimmerBlock className="h-10 w-16 rounded-lg" delayMs={delayMs + 160} />
          <ShimmerBlock className="h-10 w-22 rounded-lg" delayMs={delayMs + 190} />
        </div>

        <div className="flex items-center gap-1.5">
          <ShimmerBlock className="h-10 w-16 sm:w-20 rounded-lg" delayMs={delayMs + 210} />
          <ShimmerBlock className="h-8 w-8 rounded-lg" delayMs={delayMs + 230} />
        </div>
      </div>
    </motion.div>
  );
}

interface QuestionListSkeletonProps {
  count?: number;
}

export function QuestionListSkeleton({ count = 6 }: QuestionListSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Sorular yükleniyor"
      className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-5"
    >
      <span className="sr-only">Sorular yükleniyor...</span>
      {Array.from({ length: count }).map((_, idx) => (
        <QuestionCardSkeleton key={idx} index={idx} />
      ))}
    </div>
  );
}

export function QuestionDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Soru detayları yükleniyor"
      className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10"
    >
      <span className="sr-only">Soru detayları yükleniyor...</span>

      {/* Top back & share row */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <ShimmerBlock className="h-10 w-40 rounded-lg" delayMs={0} />
        <ShimmerBlock className="h-10 w-36 rounded-lg" delayMs={60} />
      </div>

      {/* Main question card skeleton */}
      <div className="rounded-2xl border border-[#DFDDD2] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2.5">
          <ShimmerBlock className="h-3.5 w-20 rounded-md" delayMs={40} />
          <ShimmerBlock className="h-3.5 w-24 rounded-md" delayMs={80} />
          <ShimmerBlock className="h-3.5 w-24 rounded-md" delayMs={120} />
        </div>

        <div className="mt-4 space-y-2.5">
          <ShimmerBlock className="h-7 w-[92%] rounded-lg" delayMs={100} />
          <ShimmerBlock className="h-7 w-[68%] rounded-lg" delayMs={140} />
        </div>

        <div className="mt-5 space-y-2">
          <ShimmerBlock className="h-4 w-full rounded-md" delayMs={160} />
          <ShimmerBlock className="h-4 w-[94%] rounded-md" delayMs={190} />
          <ShimmerBlock className="h-4 w-[72%] rounded-md" delayMs={220} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#ECEAE1] pt-5">
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-11 w-36 rounded-xl" delayMs={240} />
            <ShimmerBlock className="h-5 w-20 rounded-md" delayMs={270} />
          </div>
          <ShimmerBlock className="h-10 w-64 rounded-xl" delayMs={300} />
        </div>
      </div>

      {/* Answer form skeleton */}
      <div className="mt-6 rounded-2xl border border-[#DFDDD2] bg-white p-6 sm:p-7">
        <ShimmerBlock className="h-5 w-36 rounded-lg" delayMs={120} />
        <ShimmerBlock className="mt-2 h-4 w-72 max-w-full rounded-md" delayMs={160} />
        <ShimmerBlock className="mt-4 h-28 w-full rounded-xl" delayMs={200} />
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <ShimmerBlock className="h-11 w-full sm:w-64 rounded-xl" delayMs={240} />
          <ShimmerBlock className="h-11 w-full sm:w-40 rounded-xl" delayMs={280} />
        </div>
      </div>

      {/* Answer list skeletons */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <ShimmerBlock className="h-6 w-48 rounded-lg" delayMs={180} />
          <ShimmerBlock className="h-9 w-48 rounded-xl" delayMs={220} />
        </div>

        {[0, 1].map((idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[#DFDDD2] bg-white p-5 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <ShimmerBlock className="h-3.5 w-28 rounded-md" delayMs={idx * 90} />
              <ShimmerBlock className="h-3.5 w-16 rounded-md" delayMs={idx * 90 + 40} />
            </div>
            <div className="mt-3.5 space-y-2">
              <ShimmerBlock className="h-4 w-full rounded-md" delayMs={idx * 90 + 80} />
              <ShimmerBlock className="h-4 w-[88%] rounded-md" delayMs={idx * 90 + 120} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#ECEAE1] pt-3.5">
              <ShimmerBlock className="h-10 w-36 rounded-xl" delayMs={idx * 90 + 160} />
              <ShimmerBlock className="h-10 w-24 rounded-xl" delayMs={idx * 90 + 200} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
