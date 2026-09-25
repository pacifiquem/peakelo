import type { Citation, DrillKind, Writeup } from '@peakelo/shared';

export const PROFILE_CHAPTERS = [
  {
    id: 'deciders',
    label: 'How games are decided',
    href: '/profile/deciders',
    tease: (doc: Writeup) => firstLine(doc.deciders.story),
  },
  {
    id: 'clock',
    label: 'Clock',
    href: '/profile/clock',
    tease: (doc: Writeup) => firstLine(doc.clock.story),
  },
  {
    id: 'mistakes',
    label: 'Recurring mistakes',
    href: '/profile/mistakes',
    tease: (doc: Writeup) =>
      doc.mistakes.length === 0
        ? 'No repeating mistake named yet.'
        : `${doc.mistakes.length} patterns from your games.`,
  },
  {
    id: 'structures',
    label: 'Structures and lines',
    href: '/profile/structures',
    tease: (doc: Writeup) =>
      doc.structures.length === 0
        ? 'No structure stood out as a leak.'
        : doc.structures.map((block) => block.name).join(' · '),
  },
  {
    id: 'tactics',
    label: 'Tactics you miss',
    href: '/profile/tactics',
    tease: (doc: Writeup) =>
      doc.tactics.length === 0
        ? 'No tactic stood out as a miss.'
        : doc.tactics.map((block) => block.name).join(' · '),
  },
  {
    id: 'keep',
    label: 'Keep these',
    href: '/profile/keep',
    tease: (doc: Writeup) =>
      doc.keep.length === 0 ? 'No strength to protect yet.' : doc.keep.map((block) => block.name).join(' · '),
  },
  {
    id: 'now',
    label: 'What to do',
    href: '/profile/now',
    tease: (doc: Writeup) => doc.now.map((item) => item.title).join(' · '),
  },
] as const;

export type ProfileChapterId = (typeof PROFILE_CHAPTERS)[number]['id'];

export function profileChapter(slug: string) {
  return PROFILE_CHAPTERS.find((chapter) => chapter.id === slug) ?? null;
}

export function neighboringChapters(slug: string) {
  const index = PROFILE_CHAPTERS.findIndex((chapter) => chapter.id === slug);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: PROFILE_CHAPTERS[index - 1] ?? null,
    next: PROFILE_CHAPTERS[index + 1] ?? null,
  };
}

export type WriteupBottleneck = {
  key: string;
  name: string;
  story: string;
  citations: Citation[];
  href: string;
  kind: DrillKind | null;
};

export function bottleneckLead(story: string): string {
  const line = story.split(/(?<=\.)\s/)[0] ?? story;
  if (line.length <= 220) return line;
  return `${line.slice(0, 217).trimEnd()}…`;
}

export function writeupBottlenecks(document: Writeup): WriteupBottleneck[] {
  const rows: WriteupBottleneck[] = [];
  for (const block of document.mistakes) {
    rows.push({
      key: `mistakes:${block.name}`,
      name: block.name,
      story: block.story,
      citations: block.citations,
      href: '/profile/mistakes',
      kind: 'blunder_preventer',
    });
  }
  for (const block of document.tactics) {
    rows.push({
      key: `tactics:${block.name}`,
      name: block.name,
      story: block.story,
      citations: block.citations,
      href: '/profile/tactics',
      kind: 'replay_mistake',
    });
  }
  for (const block of document.structures) {
    rows.push({
      key: `structures:${block.name}`,
      name: block.name,
      story: block.story,
      citations: block.citations,
      href: '/profile/structures',
      kind: 'make_plan',
    });
  }
  if (document.clock.story) {
    rows.push({
      key: 'clock',
      name: 'Clock',
      story: document.clock.story,
      citations: [],
      href: '/profile/clock',
      kind: null,
    });
  }
  return rows;
}

function firstLine(text: string): string {
  const line = text.split(/(?<=\.)\s/)[0] ?? text;
  if (line.length <= 140) return line;
  return `${line.slice(0, 137).trimEnd()}…`;
}
