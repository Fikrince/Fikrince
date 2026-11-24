import { GoogleGenAI } from '@google/genai';
import {
  buildCorsHeaders,
  jsonResponse,
  parseJsonBody,
  type PagesEventContext,
} from '../../worker/pages-helpers.ts';

const DEFAULT_MODEL = 'gemini-4-hydrogen';

export async function onRequest(context: PagesEventContext): Promise<Response> {
  const { request, env } = context;
  const corsHeaders = buildCorsHeaders(request, env.ALLOWED_ORIGIN, true);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const requestOrigin = request.headers.get('Origin');
  const currentOrigin = new URL(request.url).origin;
  if (requestOrigin && requestOrigin !== currentOrigin) {
    const configured = (env.ALLOWED_ORIGIN ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item && item !== '*');
    if (!configured.includes(requestOrigin)) {
      return jsonResponse({ error: 'İzin verilmeyen kaynak (Origin).' }, 403, corsHeaders);
    }
  }

  if (request.method === 'GET') {
    return jsonResponse(
      {
        ok: true,
        configured: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0),
        runtime: 'cloudflare-pages-functions',
      },
      200,
      corsHeaders
    );
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Yalnızca GET ve POST desteklenir.' }, 405, corsHeaders);
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          'GEMINI_API_KEY ortam gizli anahtarı (secret) yapılandırılmamış.',
      },
      503,
      corsHeaders
    );
  }

  const body = await parseJsonBody(request);
  const rawPrompt = body.prompt;
  const rawSystemInstruction = body.systemInstruction;

  if (typeof rawPrompt !== 'string' || rawPrompt.trim().length < 2) {
    return jsonResponse(
      { error: 'Geçerli bir prompt metni (en az 2 karakter) gönderilmelidir.' },
      400,
      corsHeaders
    );
  }

  const prompt = rawPrompt.trim().slice(0, 4000);
  const systemInstruction =
    typeof rawSystemInstruction === 'string' && rawSystemInstruction.trim().length > 0
      ? rawSystemInstruction.trim().slice(0, 1000)
      : undefined;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      ...(systemInstruction ? { config: { systemInstruction } } : {}),
    });

    return jsonResponse(
      {
        text: response.text ?? '',
        model: DEFAULT_MODEL,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen Gemini API hatası.';
    console.error('Pages Function Gemini error:', message);
    return jsonResponse(
      {
        error: 'Gemini API isteği tamamlanamadı.',
      },
      502,
      corsHeaders
    );
  }
}
