import type { PublicReview } from '@peakelo/shared';
import { ApiClientError } from '@peakelo/shared';

import { api } from '@/lib/api';

export async function startPublicReview(url: string): Promise<PublicReview> {
  return api<PublicReview>('/public/reviews', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function fetchPublicReview(id: string): Promise<PublicReview> {
  return api<PublicReview>(`/public/reviews/${id}`);
}

export function previewErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Could not review that game.';
}
