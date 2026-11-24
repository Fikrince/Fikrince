import type {
  AnswerDTO,
  CategoryId,
  CreateAnswerInput,
  CreateQuestionInput,
  PlatformStatsDTO,
  QuestionDetailDTO,
  QuestionDTO,
  QuestionSort,
} from './types.ts';

export interface QuestionRepository {
  listQuestions(params: {
    clientId: string;
    category?: CategoryId | 'all';
    search?: string;
    sort?: QuestionSort;
  }): Promise<QuestionDTO[]>;
  getQuestionByIdOrSlug(idOrSlug: string, clientId: string): Promise<QuestionDetailDTO | null>;
  createQuestion(input: CreateQuestionInput, clientId: string): Promise<QuestionDetailDTO>;
  toggleQuestionLike(questionId: string, clientId: string): Promise<QuestionDTO | null>;
  createAnswer(
    questionId: string,
    input: CreateAnswerInput,
    clientId: string
  ): Promise<AnswerDTO | null>;
  toggleAnswerLike(answerId: string, clientId: string): Promise<AnswerDTO | null>;
  voteAnswer(answerId: string, clientId: string, value: -1 | 1): Promise<AnswerDTO | null>;
  getStats(): Promise<PlatformStatsDTO>;
}
