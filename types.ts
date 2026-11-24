export type CategoryId =
  | 'gunluk-hayat'
  | 'teknoloji'
  | 'alisveris'
  | 'iliskiler'
  | 'is'
  | 'digerleri';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  {
    id: 'gunluk-hayat',
    label: 'Günlük Hayat',
    description: 'Alışkanlıklar, şehir yaşamı, rutinler ve gündelik ikilemler.',
  },
  {
    id: 'teknoloji',
    label: 'Teknoloji',
    description: 'Yazılım, yapay zeka, cihazlar, dijital araçlar ve ürün fikirleri.',
  },
  {
    id: 'alisveris',
    label: 'Alışveriş',
    description: 'Satın alma kararları, fiyat-performans kıyasları ve uzun ömürlü tercihler.',
  },
  {
    id: 'iliskiler',
    label: 'İlişkiler',
    description: 'Arkadaşlık, iletişim, sınırlar ve sosyal bağlar üzerine bakış açıları.',
  },
  {
    id: 'is',
    label: 'İş',
    description: 'Kariyer geçişleri, uzaktan çalışma, girişimcilik ve ekip kültürü.',
  },
  {
    id: 'digerleri',
    label: 'Diğerleri',
    description: 'Kültür, yaratıcılık, seyahat ve tek bir başlığa sığmayan fikirler.',
  },
] as const;

export type QuestionSort = 'newest' | 'popular' | 'discussed';
export type AnswerSort = 'top' | 'newest';

export interface AnswerDTO {
  id: string;
  questionId: string;
  author: string;
  content: string;
  createdAt: string;
  likesCount: number;
  userLiked: boolean;
  voteScore: number;
  userVote: -1 | 0 | 1;
}

export interface QuestionDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  author: string;
  createdAt: string;
  likesCount: number;
  userLiked: boolean;
  answersCount: number;
  totalVotes: number;
}

export interface QuestionDetailDTO extends QuestionDTO {
  answers: AnswerDTO[];
}

export interface PlatformStatsDTO {
  totalQuestions: number;
  totalAnswers: number;
  categoryCounts: Record<CategoryId, number>;
}

export interface CreateQuestionInput {
  title: string;
  description: string;
  category: CategoryId;
  author?: string;
}

export interface CreateAnswerInput {
  content: string;
  author?: string;
}

export interface VoteInput {
  value: -1 | 1;
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((cat) => cat.id === value);
}

export function getCategoryLabel(id: CategoryId): string {
  return CATEGORIES.find((cat) => cat.id === id)?.label ?? 'Diğerleri';
}
