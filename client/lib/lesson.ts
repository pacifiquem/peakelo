import type { GameBrief, Lesson, LessonAskRequest, LessonRequest, LessonSpeaker } from '@peakelo/shared';
import { ApiClientError } from '@peakelo/shared';

import { api } from '@/lib/api';

export const SPEAKER_LABEL: Record<LessonSpeaker, string> = {
  gotham: 'GothamChess',
  hikaru: 'Hikaru',
  naroditsky: 'Naroditsky',
};

export async function fetchGameBrief(
  gameId: string,
  body: { refresh?: boolean } = {},
  signal?: AbortSignal,
): Promise<GameBrief> {
  return api<GameBrief>(`/games/${gameId}/lesson/brief`, {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
}

export async function fetchLesson(
  gameId: string,
  body: LessonRequest,
  signal?: AbortSignal,
): Promise<Lesson> {
  return api<Lesson>(`/games/${gameId}/lesson`, {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
}

export async function askLesson(
  gameId: string,
  body: LessonAskRequest,
  signal?: AbortSignal,
): Promise<Lesson> {
  const response = await api<{ answer: Lesson }>(`/games/${gameId}/lesson/ask`, {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
  return response.answer;
}

export function lessonErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'The lesson could not be written.';
}

export function isLessonOffline(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 503;
}
