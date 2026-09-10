import type { EnginePass, EnginePassStatus, Overlooked } from '@peakelo/shared';

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

const OVERLOOKED_LABELS: Record<Overlooked, string> = {
  hanging_piece: 'Hanging piece',
  missed_hanging: 'Missed hanging',
  missed_capture: 'Missed capture',
  missed_check: 'Missed check',
  missed_mate: 'Missed mate',
  missed_combination: 'Missed combination',
  material_loss: 'Material loss',
  time_scramble: 'Time scramble',
};

export function overlookedLabel(tag: Overlooked): string {
  return OVERLOOKED_LABELS[tag];
}

export function tacticDepthLabel(depth: number): string {
  if (depth >= 4) return '4+';
  return String(depth);
}