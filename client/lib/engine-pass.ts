import { OVERLOOKED_LABEL, type EnginePass, type EnginePassStatus, type Overlooked } from '@peakelo/shared';

export function isEnginePassActive(status: EnginePassStatus): boolean {
  return status === 'queued' || status === 'running';
}

export function passGameTotal(pass: EnginePass): number {
  return pass.gamesQueued + pass.gamesReady + pass.gamesFailed;
}

export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function formatCpl(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatAvgTimeMs(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function overlookedLabel(tag: Overlooked): string {
  return OVERLOOKED_LABEL[tag];
}

export function tacticDepthLabel(depth: number): string {
  if (depth >= 4) return '4+';
  return String(depth);
}