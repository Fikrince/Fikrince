import { createInitialSeedData, slugifyTurkish } from '../src/server/seed.ts';
import type { QuestionRepository } from '../src/shared/repository.ts';
import {
  CATEGORIES,
  type AnswerDTO,
  type CategoryId,
  type CreateAnswerInput,
  type CreateQuestionInput,
  type PlatformStatsDTO,
  type QuestionDetailDTO,
  type QuestionDTO,
  type QuestionSort,
} from '../src/shared/types.ts';

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(statements: D1PreparedStatementLike[]): Promise<unknown[]>;
}

interface QuestionRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  author: string;
  created_at: string;
  likes_count: number;
  user_liked: number;
  answers_count: number;
  total_votes: number;
}

interface AnswerRow {
  id: string;
  question_id: string;
  author: string;
  content: string;
  created_at: string;
  likes_count: number;
  user_liked: number;
  vote_score: number;
  user_vote: number;
}

export class D1Repository implements QuestionRepository {
  private readonly db: D1DatabaseLike;
  private seeded = false;
  private seedPromise: Promise<void> | null = null;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  private async ensureSeeded(): Promise<void> {
    if (this.seeded) return;
    if (this.seedPromise) {
      await this.seedPromise;
      return;
    }

    this.seedPromise = (async () => {
      const existing = await this.db
        .prepare('SELECT COUNT(*) as total FROM questions')
        .first<{ total: number }>();

      if ((existing?.total ?? 0) > 0) {
        this.seeded = true;
        return;
      }

      const seed = createInitialSeedData();
      const statements: D1PreparedStatementLike[] = [];

      for (const q of seed.questions) {
        statements.push(
          this.db
            .prepare(
              'INSERT OR IGNORE INTO questions (id, slug, title, description, category, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
            )
            .bind(q.id, q.slug, q.title, q.description, q.category, q.author, q.createdAt)
        );
        for (const clientId of q.likedBy) {
          statements.push(
            this.db
              .prepare(
                'INSERT OR IGNORE INTO question_likes (question_id, client_id, created_at) VALUES (?, ?, ?)'
              )
              .bind(q.id, clientId, q.createdAt)
          );
        }
      }

      for (const a of seed.answers) {
        statements.push(
          this.db
            .prepare(
              'INSERT OR IGNORE INTO answers (id, question_id, author, content, created_at) VALUES (?, ?, ?, ?, ?)'
            )
            .bind(a.id, a.questionId, a.author, a.content, a.createdAt)
        );
        for (const clientId of a.likedBy) {
          statements.push(
            this.db
              .prepare(
                'INSERT OR IGNORE INTO answer_likes (answer_id, client_id, created_at) VALUES (?, ?, ?)'
              )
              .bind(a.id, clientId, a.createdAt)
          );
        }
        for (const [clientId, value] of Object.entries(a.votesBy)) {
          statements.push(
            this.db
              .prepare(
                'INSERT OR IGNORE INTO answer_votes (answer_id, client_id, value, updated_at) VALUES (?, ?, ?, ?)'
              )
              .bind(a.id, clientId, value, a.createdAt)
          );
        }
      }

      const CHUNK_SIZE = 50;
      for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
        await this.db.batch(statements.slice(i, i + CHUNK_SIZE));
      }
      this.seeded = true;
    })();

    try {
      await this.seedPromise;
    } finally {
      this.seedPromise = null;
    }
  }

  private mapQuestionRow(row: QuestionRow): QuestionDTO {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      author: row.author,
      createdAt: row.created_at,
      likesCount: Number(row.likes_count ?? 0),
      userLiked: Number(row.user_liked ?? 0) > 0,
      answersCount: Number(row.answers_count ?? 0),
      totalVotes: Number(row.total_votes ?? 0),
    };
  }

  private mapAnswerRow(row: AnswerRow): AnswerDTO {
    const rawVote = Number(row.user_vote ?? 0);
    const userVote: -1 | 0 | 1 = rawVote === 1 ? 1 : rawVote === -1 ? -1 : 0;
    return {
      id: row.id,
      questionId: row.question_id,
      author: row.author,
      content: row.content,
      createdAt: row.created_at,
      likesCount: Number(row.likes_count ?? 0),
      userLiked: Number(row.user_liked ?? 0) > 0,
      voteScore: Number(row.vote_score ?? 0),
      userVote,
    };
  }

  async listQuestions(params: {
    clientId: string;
    category?: CategoryId | 'all';
    search?: string;
    sort?: QuestionSort;
  }): Promise<QuestionDTO[]> {
    await this.ensureSeeded();
    const { clientId, category = 'all', search = '', sort = 'newest' } = params;

    const whereClauses: string[] = [];
    const bindings: unknown[] = [clientId];

    if (category !== 'all') {
      whereClauses.push('q.category = ?');
      bindings.push(category);
    }

    const queryText = search.trim();
    if (queryText.length > 0) {
      const pattern = `%${queryText}%`;
      whereClauses.push(
        `(q.title LIKE ? OR q.description LIKE ? OR q.author LIKE ? OR EXISTS (SELECT 1 FROM answers ans WHERE ans.question_id = q.id AND ans.content LIKE ?))`
      );
      bindings.push(pattern, pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const orderBySql =
      sort === 'popular'
        ? 'ORDER BY (likes_count * 2 + total_votes) DESC, q.created_at DESC'
        : sort === 'discussed'
          ? 'ORDER BY answers_count DESC, q.created_at DESC'
          : 'ORDER BY q.created_at DESC';

    const sql = `
      SELECT
        q.id,
        q.slug,
        q.title,
        q.description,
        q.category,
        q.author,
        q.created_at,
        (SELECT COUNT(*) FROM question_likes ql WHERE ql.question_id = q.id) AS likes_count,
        (SELECT COUNT(*) FROM question_likes ql WHERE ql.question_id = q.id AND ql.client_id = ?) AS user_liked,
        (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answers_count,
        COALESCE((
          SELECT SUM(CASE WHEN s.score > 0 THEN s.score ELSE 0 END)
          FROM (
            SELECT a.id, COALESCE(SUM(av.value), 0) AS score
            FROM answers a
            LEFT JOIN answer_votes av ON av.answer_id = a.id
            WHERE a.question_id = q.id
            GROUP BY a.id
          ) s
        ), 0) AS total_votes
      FROM questions q
      ${whereSql}
      ${orderBySql}
    `;

    const { results } = await this.db.prepare(sql).bind(...bindings).all<QuestionRow>();
    return results.map((row) => this.mapQuestionRow(row));
  }

  async getQuestionByIdOrSlug(
    idOrSlug: string,
    clientId: string
  ): Promise<QuestionDetailDTO | null> {
    await this.ensureSeeded();

    const qRow = await this.db
      .prepare(
        `
        SELECT
          q.id,
          q.slug,
          q.title,
          q.description,
          q.category,
          q.author,
          q.created_at,
          (SELECT COUNT(*) FROM question_likes ql WHERE ql.question_id = q.id) AS likes_count,
          (SELECT COUNT(*) FROM question_likes ql WHERE ql.question_id = q.id AND ql.client_id = ?) AS user_liked,
          (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) AS answers_count,
          COALESCE((
            SELECT SUM(CASE WHEN s.score > 0 THEN s.score ELSE 0 END)
            FROM (
              SELECT a.id, COALESCE(SUM(av.value), 0) AS score
              FROM answers a
              LEFT JOIN answer_votes av ON av.answer_id = a.id
              WHERE a.question_id = q.id
              GROUP BY a.id
            ) s
          ), 0) AS total_votes
        FROM questions q
        WHERE q.id = ? OR q.slug = ?
        LIMIT 1
      `
      )
      .bind(clientId, idOrSlug, idOrSlug)
      .first<QuestionRow>();

    if (!qRow) return null;

    const { results: answerRows } = await this.db
      .prepare(
        `
        SELECT
          a.id,
          a.question_id,
          a.author,
          a.content,
          a.created_at,
          (SELECT COUNT(*) FROM answer_likes al WHERE al.answer_id = a.id) AS likes_count,
          (SELECT COUNT(*) FROM answer_likes al WHERE al.answer_id = a.id AND al.client_id = ?) AS user_liked,
          COALESCE((SELECT SUM(av.value) FROM answer_votes av WHERE av.answer_id = a.id), 0) AS vote_score,
          COALESCE((SELECT av.value FROM answer_votes av WHERE av.answer_id = a.id AND av.client_id = ?), 0) AS user_vote
        FROM answers a
        WHERE a.question_id = ?
        ORDER BY vote_score DESC, a.created_at DESC
      `
      )
      .bind(clientId, clientId, qRow.id)
      .all<AnswerRow>();

    return {
      ...this.mapQuestionRow(qRow),
      answers: answerRows.map((row) => this.mapAnswerRow(row)),
    };
  }

  async createQuestion(
    input: CreateQuestionInput,
    clientId: string
  ): Promise<QuestionDetailDTO> {
    await this.ensureSeeded();
    const randomHex = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const id = `q-${randomHex}`;
    const baseSlug = slugifyTurkish(input.title) || 'fikir';
    const slug = `${baseSlug}-${randomHex.slice(0, 4)}`;
    const author = input.author?.trim() || 'Anonim';
    const createdAt = new Date().toISOString();

    await this.db.batch([
      this.db
        .prepare(
          'INSERT INTO questions (id, slug, title, description, category, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .bind(id, slug, input.title.trim(), input.description.trim(), input.category, author, createdAt),
      this.db
        .prepare(
          'INSERT OR IGNORE INTO question_likes (question_id, client_id, created_at) VALUES (?, ?, ?)'
        )
        .bind(id, clientId, createdAt),
    ]);

    return {
      id,
      slug,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      author,
      createdAt,
      likesCount: 1,
      userLiked: true,
      answersCount: 0,
      totalVotes: 0,
      answers: [],
    };
  }

  async toggleQuestionLike(
    questionId: string,
    clientId: string
  ): Promise<QuestionDTO | null> {
    await this.ensureSeeded();
    const exists = await this.db
      .prepare('SELECT id FROM questions WHERE id = ?')
      .bind(questionId)
      .first<{ id: string }>();
    if (!exists) return null;

    const liked = await this.db
      .prepare('SELECT 1 AS found FROM question_likes WHERE question_id = ? AND client_id = ?')
      .bind(questionId, clientId)
      .first<{ found: number }>();

    if (liked) {
      await this.db
        .prepare('DELETE FROM question_likes WHERE question_id = ? AND client_id = ?')
        .bind(questionId, clientId)
        .run();
    } else {
      await this.db
        .prepare(
          'INSERT OR IGNORE INTO question_likes (question_id, client_id, created_at) VALUES (?, ?, ?)'
        )
        .bind(questionId, clientId, new Date().toISOString())
        .run();
    }

    const detail = await this.getQuestionByIdOrSlug(questionId, clientId);
    if (!detail) return null;
    const { answers: _answers, ...summary } = detail;
    return summary;
  }

  async createAnswer(
    questionId: string,
    input: CreateAnswerInput,
    clientId: string
  ): Promise<AnswerDTO | null> {
    await this.ensureSeeded();
    const exists = await this.db
      .prepare('SELECT id FROM questions WHERE id = ?')
      .bind(questionId)
      .first<{ id: string }>();
    if (!exists) return null;

    const id = `a-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const author = input.author?.trim() || 'Anonim';
    const createdAt = new Date().toISOString();

    await this.db.batch([
      this.db
        .prepare(
          'INSERT INTO answers (id, question_id, author, content, created_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(id, questionId, author, input.content.trim(), createdAt),
      this.db
        .prepare(
          'INSERT OR IGNORE INTO answer_votes (answer_id, client_id, value, updated_at) VALUES (?, ?, 1, ?)'
        )
        .bind(id, clientId, createdAt),
    ]);

    return {
      id,
      questionId,
      author,
      content: input.content.trim(),
      createdAt,
      likesCount: 0,
      userLiked: false,
      voteScore: 1,
      userVote: 1,
    };
  }

  private async getAnswerById(answerId: string, clientId: string): Promise<AnswerDTO | null> {
    const row = await this.db
      .prepare(
        `
        SELECT
          a.id,
          a.question_id,
          a.author,
          a.content,
          a.created_at,
          (SELECT COUNT(*) FROM answer_likes al WHERE al.answer_id = a.id) AS likes_count,
          (SELECT COUNT(*) FROM answer_likes al WHERE al.answer_id = a.id AND al.client_id = ?) AS user_liked,
          COALESCE((SELECT SUM(av.value) FROM answer_votes av WHERE av.answer_id = a.id), 0) AS vote_score,
          COALESCE((SELECT av.value FROM answer_votes av WHERE av.answer_id = a.id AND av.client_id = ?), 0) AS user_vote
        FROM answers a
        WHERE a.id = ?
        LIMIT 1
      `
      )
      .bind(clientId, clientId, answerId)
      .first<AnswerRow>();

    return row ? this.mapAnswerRow(row) : null;
  }

  async toggleAnswerLike(answerId: string, clientId: string): Promise<AnswerDTO | null> {
    await this.ensureSeeded();
    const exists = await this.db
      .prepare('SELECT id FROM answers WHERE id = ?')
      .bind(answerId)
      .first<{ id: string }>();
    if (!exists) return null;

    const liked = await this.db
      .prepare('SELECT 1 AS found FROM answer_likes WHERE answer_id = ? AND client_id = ?')
      .bind(answerId, clientId)
      .first<{ found: number }>();

    if (liked) {
      await this.db
        .prepare('DELETE FROM answer_likes WHERE answer_id = ? AND client_id = ?')
        .bind(answerId, clientId)
        .run();
    } else {
      await this.db
        .prepare(
          'INSERT OR IGNORE INTO answer_likes (answer_id, client_id, created_at) VALUES (?, ?, ?)'
        )
        .bind(answerId, clientId, new Date().toISOString())
        .run();
    }

    return this.getAnswerById(answerId, clientId);
  }

  async voteAnswer(
    answerId: string,
    clientId: string,
    value: -1 | 1
  ): Promise<AnswerDTO | null> {
    await this.ensureSeeded();
    const exists = await this.db
      .prepare('SELECT id FROM answers WHERE id = ?')
      .bind(answerId)
      .first<{ id: string }>();
    if (!exists) return null;

    const current = await this.db
      .prepare('SELECT value FROM answer_votes WHERE answer_id = ? AND client_id = ?')
      .bind(answerId, clientId)
      .first<{ value: number }>();

    if (current && current.value === value) {
      await this.db
        .prepare('DELETE FROM answer_votes WHERE answer_id = ? AND client_id = ?')
        .bind(answerId, clientId)
        .run();
    } else {
      await this.db
        .prepare(
          `INSERT INTO answer_votes (answer_id, client_id, value, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(answer_id, client_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        )
        .bind(answerId, clientId, value, new Date().toISOString())
        .run();
    }

    return this.getAnswerById(answerId, clientId);
  }

  async getStats(): Promise<PlatformStatsDTO> {
    await this.ensureSeeded();

    const totals = await this.db
      .prepare(
        `SELECT
          (SELECT COUNT(*) FROM questions) AS total_questions,
          (SELECT COUNT(*) FROM answers) AS total_answers`
      )
      .first<{ total_questions: number; total_answers: number }>();

    const { results: catRows } = await this.db
      .prepare('SELECT category, COUNT(*) AS cnt FROM questions GROUP BY category')
      .all<{ category: CategoryId; cnt: number }>();

    const categoryCounts = CATEGORIES.reduce<Record<CategoryId, number>>(
      (acc, cat) => {
        acc[cat.id] = 0;
        return acc;
      },
      {
        'gunluk-hayat': 0,
        teknoloji: 0,
        alisveris: 0,
        iliskiler: 0,
        is: 0,
        digerleri: 0,
      }
    );

    for (const row of catRows) {
      if (row.category in categoryCounts) {
        categoryCounts[row.category] = Number(row.cnt ?? 0);
      }
    }

    return {
      totalQuestions: Number(totals?.total_questions ?? 0),
      totalAnswers: Number(totals?.total_answers ?? 0),
      categoryCounts,
    };
  }
}
