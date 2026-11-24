import { isCategoryId, type QuestionSort } from '../../src/shared/types.ts';
import { D1Repository } from '../../worker/d1-repository.ts';
import {
  buildCorsHeaders,
  getClientId,
  jsonResponse,
  parseJsonBody,
  safeDecodeParam,
  type PagesEventContext,
} from '../../worker/pages-helpers.ts';

export async function onRequest(context: PagesEventContext): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = buildCorsHeaders(request, env.ALLOWED_ORIGIN);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (request.method === 'GET' && pathname === '/api/health') {
    return jsonResponse(
      {
        ok: true,
        runtime: 'cloudflare-pages-functions',
        databaseBound: Boolean(env.DB),
        geminiConfigured: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0),
      },
      200,
      corsHeaders
    );
  }

  if (!env.DB) {
    return jsonResponse(
      {
        error:
          'Cloudflare D1 veritabanı (DB) bağlanmamış. wrangler.toml ve Pages ayarlarından DB binding ekleyin.',
      },
      503,
      corsHeaders
    );
  }

  const repo = new D1Repository(env.DB);
  const clientId = getClientId(request);

  try {
    if (request.method === 'GET' && pathname === '/api/stats') {
      const stats = await repo.getStats();
      return jsonResponse(stats, 200, corsHeaders);
    }

    if (request.method === 'GET' && pathname === '/api/questions') {
      const rawCategory = url.searchParams.get('category') || 'all';
      const category =
        rawCategory === 'all' || !isCategoryId(rawCategory) ? 'all' : rawCategory;
      const search = (url.searchParams.get('search') || '').slice(0, 120);
      const rawSort = url.searchParams.get('sort') || 'newest';
      const sort: QuestionSort =
        rawSort === 'popular' || rawSort === 'discussed' ? rawSort : 'newest';

      const questions = await repo.listQuestions({
        clientId,
        category,
        search,
        sort,
      });
      return jsonResponse({ questions }, 200, corsHeaders);
    }

    if (request.method === 'POST' && pathname === '/api/questions') {
      const body = await parseJsonBody(request);
      const title = body.title;
      const description = body.description;
      const category = body.category;
      const author = body.author;

      if (typeof title !== 'string' || title.trim().length < 5) {
        return jsonResponse({ error: 'Başlık en az 5 karakter olmalıdır.' }, 400, corsHeaders);
      }
      if (typeof category !== 'string' || !isCategoryId(category)) {
        return jsonResponse({ error: 'Geçerli bir kategori seçmelisiniz.' }, 400, corsHeaders);
      }

      const created = await repo.createQuestion(
        {
          title: title.trim().slice(0, 180),
          description:
            typeof description === 'string' ? description.trim().slice(0, 2000) : '',
          category,
          author:
            (typeof author === 'string' ? author.trim().slice(0, 40) : '') || 'Anonim',
        },
        clientId
      );
      return jsonResponse({ question: created }, 201, corsHeaders);
    }

    // /api/questions/:id/like
    const qLikeMatch = pathname.match(/^\/api\/questions\/([^/]+)\/like$/);
    if (request.method === 'POST' && qLikeMatch) {
      const id = safeDecodeParam(qLikeMatch[1]);
      if (!id) {
        return jsonResponse({ error: 'Geçersiz soru kimliği.' }, 400, corsHeaders);
      }
      const updated = await repo.toggleQuestionLike(id, clientId);
      if (!updated) {
        return jsonResponse({ error: 'Soru bulunamadı.' }, 404, corsHeaders);
      }
      return jsonResponse({ question: updated }, 200, corsHeaders);
    }

    // /api/questions/:id/answers
    const qAnswersMatch = pathname.match(/^\/api\/questions\/([^/]+)\/answers$/);
    if (request.method === 'POST' && qAnswersMatch) {
      const id = safeDecodeParam(qAnswersMatch[1]);
      if (!id) {
        return jsonResponse({ error: 'Geçersiz soru kimliği.' }, 400, corsHeaders);
      }
      const body = await parseJsonBody(request);
      const content = body.content;
      const author = body.author;

      if (typeof content !== 'string' || content.trim().length < 2) {
        return jsonResponse(
          { error: 'Görüşünüz en az 2 karakter olmalıdır.' },
          400,
          corsHeaders
        );
      }

      const created = await repo.createAnswer(
        id,
        {
          content: content.trim().slice(0, 2000),
          author:
            (typeof author === 'string' ? author.trim().slice(0, 40) : '') || 'Anonim',
        },
        clientId
      );
      if (!created) {
        return jsonResponse({ error: 'Soru bulunamadı.' }, 404, corsHeaders);
      }
      return jsonResponse({ answer: created }, 201, corsHeaders);
    }

    // /api/questions/:idOrSlug
    const qDetailMatch = pathname.match(/^\/api\/questions\/([^/]+)$/);
    if (request.method === 'GET' && qDetailMatch) {
      const idOrSlug = safeDecodeParam(qDetailMatch[1]);
      if (!idOrSlug) {
        return jsonResponse({ error: 'Geçersiz soru adresi.' }, 400, corsHeaders);
      }
      const detail = await repo.getQuestionByIdOrSlug(idOrSlug, clientId);
      if (!detail) {
        return jsonResponse({ error: 'Soru bulunamadı.' }, 404, corsHeaders);
      }
      return jsonResponse({ question: detail }, 200, corsHeaders);
    }

    // /api/answers/:id/like
    const aLikeMatch = pathname.match(/^\/api\/answers\/([^/]+)\/like$/);
    if (request.method === 'POST' && aLikeMatch) {
      const id = safeDecodeParam(aLikeMatch[1]);
      if (!id) {
        return jsonResponse({ error: 'Geçersiz cevap kimliği.' }, 400, corsHeaders);
      }
      const updated = await repo.toggleAnswerLike(id, clientId);
      if (!updated) {
        return jsonResponse({ error: 'Cevap bulunamadı.' }, 404, corsHeaders);
      }
      return jsonResponse({ answer: updated }, 200, corsHeaders);
    }

    // /api/answers/:id/vote
    const aVoteMatch = pathname.match(/^\/api\/answers\/([^/]+)\/vote$/);
    if (request.method === 'POST' && aVoteMatch) {
      const id = safeDecodeParam(aVoteMatch[1]);
      if (!id) {
        return jsonResponse({ error: 'Geçersiz cevap kimliği.' }, 400, corsHeaders);
      }
      const body = await parseJsonBody(request);
      if (body.value !== 1 && body.value !== -1) {
        return jsonResponse({ error: 'Geçersiz oy değeri.' }, 400, corsHeaders);
      }
      const updated = await repo.voteAnswer(id, clientId, body.value);
      if (!updated) {
        return jsonResponse({ error: 'Cevap bulunamadı.' }, 404, corsHeaders);
      }
      return jsonResponse({ answer: updated }, 200, corsHeaders);
    }

    return jsonResponse({ error: 'Endpoint bulunamadı.' }, 404, corsHeaders);
  } catch (error) {
    console.error('Pages Function API error:', error);
    return jsonResponse({ error: 'Sunucu hatası oluştu.' }, 500, corsHeaders);
  }
}
