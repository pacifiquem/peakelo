import { uciSquares } from '@peakelo/engine';
import type { CourseSkillBand, DrillInsight, DrillKind } from '@peakelo/shared';

export function missInsight(input: {
  kind: DrillKind;
  band: CourseSkillBand;
  playedSan: string;
  bestSan: string;
  bestUci: string;
  why: string;
}): DrillInsight {
  const squares = uciSquares(input.bestUci);
  return {
    headline: `${input.bestSan} was the save.`,
    segments: [
      {
        id: 'played',
        text: `You played ${input.playedSan}. ${input.bestSan} keeps the position together.`,
      },
      {
        id: 'why',
        text: input.why,
        lineUci: [input.bestUci],
        lineSan: [input.bestSan],
      },
    ],
    arrows: squares ? [{ from: squares.from, to: squares.to, brush: 'green' }] : [],
  };
}

export function hitInsight(input: {
  kind: DrillKind;
  band: CourseSkillBand;
  bestSan: string;
  why: string;
}): DrillInsight {
  return {
    headline: `${input.bestSan} is the idea.`,
    segments: [
      {
        id: 'hit',
        text: `${input.bestSan} is what you needed. Hold that question the next time this shape appears.`,
      },
      { id: 'why', text: input.why },
    ],
    arrows: [],
  };
}
