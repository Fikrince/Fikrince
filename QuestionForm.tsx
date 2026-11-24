import { useState, type FormEvent } from 'react';
import { CATEGORIES, type CategoryId, type QuestionDetailDTO } from '../shared/types.ts';
import { fikrinceApi, getSavedAuthorAlias, saveAuthorAlias } from '../services/api.ts';

interface QuestionFormProps {
  defaultCategory?: CategoryId;
  compact?: boolean;
  onCreated: (question: QuestionDetailDTO) => void;
  onCancel?: () => void;
}

export function QuestionForm({
  defaultCategory = 'teknoloji',
  compact = false,
  onCreated,
  onCancel,
}: QuestionFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>(defaultCategory);
  const [author, setAuthor] = useState(() => getSavedAuthorAlias());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5) {
      setError('Lütfen en az 5 karakterlik net bir başlık veya soru yaz.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      saveAuthorAlias(author);
      const created = await fikrinceApi.createQuestion({
        title: trimmedTitle,
        description: description.trim(),
        category,
        author: author.trim() || 'Anonim',
      });
      setTitle('');
      setDescription('');
      onCreated(created);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Soru yayınlanırken bir hata oluştu.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label
          htmlFor={compact ? 'hero-question-title' : 'modal-question-title'}
          className="block text-sm font-semibold text-[#111210] mb-1.5"
        >
          Aklındaki soru veya fikir nedir?
        </label>
        <input
          id={compact ? 'hero-question-title' : 'modal-question-title'}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={180}
          placeholder="Örn: Uzaktan çalışmada yeni bir şehre taşınmak mantıklı mı?"
          className="w-full min-h-[44px] rounded-xl border border-[#D8D6CB] bg-[#F5F4EE] px-3.5 py-2.5 text-sm text-[#111210] placeholder:text-[#787A70] focus:border-[#111210] focus:bg-white focus:outline-none transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor={compact ? 'hero-question-desc' : 'modal-question-desc'}
          className="block text-sm font-semibold text-[#111210] mb-1.5"
        >
          Detaylar <span className="font-normal text-[#66685F]">(isteğe bağlı)</span>
        </label>
        <textarea
          id={compact ? 'hero-question-desc' : 'modal-question-desc'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={compact ? 3 : 4}
          maxLength={2000}
          placeholder="Kararsız kaldığın noktaları, seçeneklerini veya bağlamı kısaca anlat..."
          className="w-full rounded-xl border border-[#D8D6CB] bg-[#F5F4EE] px-3.5 py-2.5 text-sm text-[#111210] placeholder:text-[#787A70] focus:border-[#111210] focus:bg-white focus:outline-none transition-colors resize-y"
        />
      </div>

      <div>
        <span className="block text-sm font-semibold text-[#111210] mb-1.5">
          Kategori seçimi
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const selected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111210] ${
                  selected
                    ? 'bg-[#111210] text-[#D4FF00]'
                    : 'bg-[#ECEAE1] text-[#3E403A] hover:bg-[#E1DFD4] hover:text-[#111210]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
        <div className="flex-1">
          <label
            htmlFor={compact ? 'hero-question-author' : 'modal-question-author'}
            className="block text-xs font-medium text-[#55564E] mb-1"
          >
            Görünecek adın <span className="text-[#787A70]">(boş bırakılırsa Anonim)</span>
          </label>
          <input
            id={compact ? 'hero-question-author' : 'modal-question-author'}
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={40}
            placeholder="Anonim"
            className="w-full min-h-[42px] rounded-xl border border-[#D8D6CB] bg-[#F5F4EE] px-3 py-2 text-sm text-[#111210] placeholder:text-[#787A70] focus:border-[#111210] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-[44px] rounded-xl border border-[#D8D6CB] bg-transparent px-4 py-2 text-sm font-medium text-[#4A4B44] hover:bg-[#ECEAE1] hover:text-[#111210] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Vazgeç
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] flex-1 sm:flex-none rounded-xl bg-[#D4FF00] px-5 py-2.5 text-sm font-bold text-[#111210] transition-colors duration-150 hover:bg-[#C6F000] active:scale-[0.98] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111210]"
          >
            {submitting ? 'Yayınlanıyor...' : 'Fikrini Yayınla'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
    </form>
  );
}
