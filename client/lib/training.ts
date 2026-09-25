import type {
  DrillAskRequest,
  DrillMoveBody,
  DrillMoveResponse,
  DrillPlay,
  Lesson,
  PaginatedResult,
  PublicCoachProfile,
  PublicDrill,
  PublicRoadmap,
  PublicWriteup,
  TrainingDesk,
} from '@peakelo/shared';
import { ApiClientError } from '@peakelo/shared';

import { api } from '@/lib/api';

export async function fetchCoachProfile(): Promise<PublicCoachProfile> {
  return api<PublicCoachProfile>('/profile');
}

export async function fetchTrainingDesk(): Promise<TrainingDesk> {
  return api<TrainingDesk>('/training');
}

export async function queueWriteup(refresh = false): Promise<PublicWriteup> {
  return api<PublicWriteup>('/training/writeup', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });
}

export async function fetchRoadmap(): Promise<{ roadmap: PublicRoadmap | null }> {
  return api<{ roadmap: PublicRoadmap | null }>('/roadmap');
}

export async function fetchDrills(
  query: { status?: string; kind?: string; page?: number; pageSize?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.kind) params.set('kind', query.kind);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return api<PaginatedResult<PublicDrill>>(`/drills${suffix}`);
}

export async function fetchDrill(id: string): Promise<DrillPlay> {
  return api<DrillPlay>(`/drills/${id}`);
}

export async function playDrillMove(id: string, body: DrillMoveBody): Promise<DrillMoveResponse> {
  return api<DrillMoveResponse>(`/drills/${id}/move`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function askDrill(id: string, body: DrillAskRequest): Promise<Lesson> {
  const response = await api<{ answer: Lesson }>(`/drills/${id}/ask`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.answer;
}

export function trainingErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'The coach could not finish that.';
}

export function isCoachOffline(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 503;
}
