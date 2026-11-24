import type {
  AnswerDTO,
  CategoryId,
  CreateAnswerInput,
  CreateQuestionInput,
  PlatformStatsDTO,
  QuestionDetailDTO,
  QuestionDTO,
  QuestionSort,
} from '../shared/types.ts';

const CLIENT_ID_KEY = 'fikrince_client_id';
const AUTHOR_ALIAS_KEY = 'fikrince_author_alias';

export function getClientId(): string {
  try {
    let existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{6,64}$/.test(existing)) {
      return existing;
    }
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
        : Math.random().toString(36).slice(2, 14);
    existing = `usr_${randomPart}`;
    localStorage.setItem(CLIENT_ID_KEY, existing);
    return existing;
  } catch {
    return 'guest_session';
  }
}

export function getSavedAuthorAlias(): string {
  try {
    return localStorage.getItem(AUTHOR_ALIAS_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveAuthorAlias(alias: string): void {
  try {
    const trimmed = alias.trim();
    if (trimmed) {
      localStorage.setItem(AUTHOR_ALIAS_KEY, trimmed);
    } else {
      localStorage.removeItem(AUTHOR_ALIAS_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

const API_BASE_URL = (
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL ?? ''
).replace(/\/+$/, '');

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('x-client-id', getClientId());
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof payload?.error === 'string'
        ? payload.error
        : 'İstek işlenirken bir sorun oluştu.';
    throw new Error(message);
  }

  return payload as T;
}

export const fikrinceApi = {
  async getStats(): Promise<PlatformStatsDTO> {
    return request<PlatformStatsDTO>('/api/stats');
  },

  async listQuestions(params: {
    category?: CategoryId | 'all';
    search?: string;
    sort?: QuestionSort;
  }): Promise<QuestionDTO[]> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') {
      query.set('category', params.category);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.sort) {
      query.set('sort', params.sort);
    }
    const qs = query.toString();
    const data = await request<{ questions: QuestionDTO[] }>(
      `/api/questions${qs ? `?${qs}` : ''}`
    );
    return data.questions;
  },

  async getQuestion(idOrSlug: string): Promise<QuestionDetailDTO> {
    const data = await request<{ question: QuestionDetailDTO }>(
      `/api/questions/${encodeURIComponent(idOrSlug)}`
    );
    return data.question;
  },

  async createQuestion(input: CreateQuestionInput): Promise<QuestionDetailDTO> {
    const data = await request<{ question: QuestionDetailDTO }>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.question;
  },

  async toggleQuestionLike(questionId: string): Promise<QuestionDTO> {
    const data = await request<{ question: QuestionDTO }>(
      `/api/questions/${encodeURIComponent(questionId)}/like`,
      { method: 'POST' }
    );
    return data.question;
  },

  async createAnswer(
    questionId: string,
    input: CreateAnswerInput
  ): Promise<AnswerDTO> {
    const data = await request<{ answer: AnswerDTO }>(
      `/api/questions/${encodeURIComponent(questionId)}/answers`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    );
    return data.answer;
  },

  async toggleAnswerLike(answerId: string): Promise<AnswerDTO> {
    const data = await request<{ answer: AnswerDTO }>(
      `/api/answers/${encodeURIComponent(answerId)}/like`,
      { method: 'POST' }
    );
    return data.answer;
  },

  async voteAnswer(answerId: string, value: -1 | 1): Promise<AnswerDTO> {
    const data = await request<{ answer: AnswerDTO }>(
      `/api/answers/${encodeURIComponent(answerId)}/vote`,
      {
        method: 'POST',
        body: JSON.stringify({ value }),
      }
    );
    return data.answer;
  },
};
