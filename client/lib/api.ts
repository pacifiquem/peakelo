import { ApiClientError, type ApiErrorBody } from '@peakelo/shared';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function oauthStartUrl(provider: 'google' | 'lichess' | 'chesscom', intent?: 'link') {
  const url = new URL(`${API_URL}/auth/${provider}`);
  if (intent) url.searchParams.set('intent', intent);
  return url.toString();
}

export function addSourceHref(source: 'lichess' | 'chesscom') {
  if (source === 'chesscom') return '/connect/chesscom';
  return oauthStartUrl('lichess', 'link');
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
  const body = (await response.json().catch(() => null)) as ApiErrorBody | T | null;
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiClientError(
      response.status,
      error?.code ?? 'ERROR',
      error?.message ?? 'Request failed',
      error?.details,
    );
  }
  return body as T;
}
