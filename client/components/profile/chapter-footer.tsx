import Link from 'next/link';

import { neighboringChapters, type ProfileChapterId } from '@/lib/profile-chapters';

export function ChapterFooter({ chapterId }: { chapterId: ProfileChapterId }) {
  const { prev, next } = neighboringChapters(chapterId);

  return (
    <nav aria-label="Profile chapters" className="flex flex-col gap-3 border-t-2 border-ink pt-4">
      <div className="flex flex-wrap justify-between gap-3">
        {prev ? (
          <Link
            href={prev.href}
            className="font-display text-sm font-bold underline decoration-2 underline-offset-4"
          >
            ← {prev.label}
          </Link>
        ) : (
          <Link
            href="/profile"
            className="font-display text-sm font-bold underline decoration-2 underline-offset-4"
          >
            ← Who you are
          </Link>
        )}
        {next ? (
          <Link
            href={next.href}
            className="font-display text-sm font-bold underline decoration-2 underline-offset-4"
          >
            {next.label} →
          </Link>
        ) : (
          <Link
            href="/drills"
            className="font-display text-sm font-bold underline decoration-2 underline-offset-4"
          >
            Open drills →
          </Link>
        )}
      </div>
      <Link href="/profile" className="font-mono text-sm text-text-sub-600 underline decoration-2 underline-offset-4">
        All chapters
      </Link>
    </nav>
  );
}
