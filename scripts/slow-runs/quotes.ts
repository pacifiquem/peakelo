import type { TranscriptCue } from './types';

const NOISE = /\[(?:music|applause|laughter|inaudible|silence)\]/gi;

export function dedupeCues(cues: TranscriptCue[]): TranscriptCue[] {
  const out: TranscriptCue[] = [];
  let lastWords: string[] = [];
  for (const cue of cues) {
    if (cue.duration < 0.05) continue;
    const words = cue.text
      .replace(/<[^>]+>/g, ' ')
      .replace(NOISE, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
    if (words.length === 0) continue;
    let overlap = 0;
    const max = Math.min(words.length, lastWords.length);
    for (let n = max; n > 0; n -= 1) {
      const prev = lastWords.slice(-n).join(' ').toLowerCase();
      const next = words.slice(0, n).join(' ').toLowerCase();
      if (prev === next) {
        overlap = n;
        break;
      }
    }
    const fresh = words.slice(overlap);
    if (fresh.length === 0) continue;
    out.push({ text: fresh.join(' '), start: cue.start, duration: cue.duration });
    lastWords = words;
  }
  return out;
}

export function cuesInWindow(
  cues: TranscriptCue[],
  startSec: number,
  endSec: number,
): TranscriptCue[] {
  return cues.filter((cue) => cue.start >= startSec && cue.start < endSec);
}

export function cleanQuote(cues: TranscriptCue[], maxChars = 600): string {
  const raw = cues
    .map((cue) => cue.text)
    .join(' ')
    .replace(NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 12);
  const picked = (sentences.length > 0 ? sentences.slice(0, 3) : [raw]).join(' ');
  if (picked.length <= maxChars) return picked;
  return `${picked.slice(0, maxChars - 1).trimEnd()}…`;
}
