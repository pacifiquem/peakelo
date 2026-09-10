const CLK_RE = /\[%clk\s+(\d+):(\d{1,2}(?:\.\d+)?)(?::(\d{1,2}(?:\.\d+)?))?\]/gi;

export function parseClkComment(text: string): number | null {
  let last: number | null = null;
  for (const match of text.matchAll(CLK_RE)) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (match[3] !== undefined) {
      last = Math.round((first * 3600 + second * 60 + Number(match[3])) * 1000);
    } else {
      last = Math.round((first * 60 + second) * 1000);
    }
  }
  return last;
}

export function parseTimeControlHeader(
  value: string | undefined,
): { baseMs: number; incrementMs: number } | null {
  if (!value) return null;
  const withInc = /^(\d+)\+(\d+)$/.exec(value.trim());
  if (withInc) {
    return { baseMs: Number(withInc[1]) * 1000, incrementMs: Number(withInc[2]) * 1000 };
  }
  const baseOnly = /^(\d+)$/.exec(value.trim());
  if (baseOnly) {
    return { baseMs: Number(baseOnly[1]) * 1000, incrementMs: 0 };
  }
  return null;
}

export function timeSpentMs(
  previousClockAfterMs: number | null,
  clockAfterMs: number | null,
  incrementMs = 0,
): number | null {
  if (previousClockAfterMs === null || clockAfterMs === null) return null;
  return Math.max(0, previousClockAfterMs - clockAfterMs + incrementMs);
}
