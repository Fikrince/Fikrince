import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { CategoryId, QuestionDetailDTO } from '../shared/types.ts';
import { QuestionForm } from './QuestionForm.tsx';

interface CreateQuestionModalProps {
  open: boolean;
  defaultCategory?: CategoryId;
  onClose: () => void;
  onCreated: (question: QuestionDetailDTO) => void;
}

export function CreateQuestionModal({
  open,
  defaultCategory = 'teknoloji',
  onClose,
  onCreated,
}: CreateQuestionModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#111210]/65 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-question-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-t-3xl sm:rounded-2xl border border-[#DFDDD2] bg-white p-6 sm:p-7 shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#ECEAE1]">
          <div>
            <h2
              id="create-question-modal-title"
              className="font-display text-xl sm:text-2xl font-bold text-[#111210]"
            >
              Yeni Fikir veya Soru Paylaş
            </h2>
            <p className="mt-1 text-sm text-[#5A5C53]">
              Aklındaki konuyu aç, topluluktan gerçek görüşler topla.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Pencereyi kapat"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#4A4B44] hover:bg-[#F5F4EE] hover:text-[#111210] transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <QuestionForm
            defaultCategory={defaultCategory}
            onCreated={onCreated}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
