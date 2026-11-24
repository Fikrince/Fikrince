import type { D1DatabaseLike } from './d1-repository.ts';

export interface PagesEnv {
  DB?: D1DatabaseLike;
  ALLOWED_ORIGIN?: string;
  GEMINI_API_KEY?: string;
}

export interface PagesEventContext<
  Params extends Record<string, string | string[]> = Record<string, string | string[]>
> {
  request: Request;
  env: PagesEnv;
  params: Params;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
}

export function buildCorsHeaders(
  request: Request,
  configuredOrigin?: string,
  restrictCrossOriginByDefault = false
): Record<string, string> {
  const originConfig = (configuredOrigin ?? '').trim();
  const requestOrigin = request.headers.get('Origin');
  const requestUrlOrigin = new URL(request.url).origin;

  let allowOrigin: string | null = null;

  if (originConfig && originConfig !== '*') {
    const allowed = originConfig
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (requestOrigin && allowed.includes(requestOrigin)) {
      allowOrigin = requestOrigin;
    } else if (!restrictCrossOriginByDefault) {
      allowOrigin = allowed[0] ?? null;
    }
  } else if (restrictCrossOriginByDefault) {
    if (requestOrigin && requestOrigin === requestUrlOrigin) {
      allowOrigin = requestOrigin;
    }
  } else {
    allowOrigin = '*';
  }

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-client-id',
  };

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
    if (allowOrigin !== '*') {
      headers.Vary = 'Origin';
    }
  }

  return headers;
}

export function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders,
    },
  });
}

export function getClientId(request: Request): string {
  const header = request.headers.get('x-client-id');
  if (header && /^[a-zA-Z0-9_-]{6,64}$/.test(header)) {
    return header;
  }
  return 'anonymous-guest';
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = await request.json();
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function safeDecodeParam(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
