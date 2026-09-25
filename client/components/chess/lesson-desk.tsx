'use client';

import { useState } from 'react';
import type { GameBrief, Lesson, LessonSegment } from '@peakelo/shared';
import { RiArrowGoBackLine, RiQuestionLine } from '@remixicon/react';

import { SPEAKER_LABEL } from '@/lib/lesson';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import { cn } from '@/utils/cn';

export function LessonDesk({
  brief,
  lesson,
  briefLoading,
  lessonLoading,
  offline,
  error,
  variationActive,
  onEnterLine,
  onLeaveVariation,
  onAsk,
  onSelectPly,
  onTeach,
  asking,
}: {
  brief: GameBrief | null;
  lesson: Lesson | null;
  briefLoading: boolean;
  lessonLoading: boolean;
  offline: boolean;
  error: string | null;
  variationActive: boolean;
  onEnterLine: (uci: string[]) => void;
  onLeaveVariation: () => void;
  onAsk: (question: string) => void;
  onSelectPly: (ply: number) => void;
  onTeach: () => void;
  asking: boolean;
}) {
  const [question, setQuestion] = useState('');

  if (briefLoading && !brief && !lesson) {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Lesson</p>
        <p className="mt-2 text-sm text-text-sub-600">Reading the game…</p>
      </section>
    );
  }

  if (offline && !lesson) {
    return (
      <section className="border-2 border-ink bg-bg-white-0 p-5 shadow-regular-xs">
        <p className="font-mono text-sm text-text-sub-600">Lesson</p>
        <h2 className="mt-2 font-display text-xl font-extrabold">I can’t write the lesson right now.</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
          The board and the move marks still work. Try the lesson again in a bit.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 border-2 border-t-4 border-ink border-t-cyan bg-bg-white-0 p-5 shadow-regular-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-mono text-sm text-text-sub-600">
          {brief?.playerRating
            ? `Lesson · ${brief.playerRating.source} ${brief.playerRating.timeControl} ${brief.playerRating.rating}`
            : 'Lesson'}
        </p>
        {variationActive ? (
          <Button.Root
            type="button"
            variant="neutral"
            mode="stroke"
            size="small"
            className="w-fit"
            onClick={onLeaveVariation}
          >
            <Button.Icon as={RiArrowGoBackLine} />
            Back to the game
          </Button.Root>
        ) : null}
      </div>

      {brief ? <GameBriefBlock brief={brief} compact={Boolean(lesson)} onSelectPly={onSelectPly} /> : null}

      {lesson ? (
        <div>
          <h3 className="font-display text-xl font-extrabold text-text-strong-950">{lesson.headline}</h3>
          <div className="mt-3 flex max-w-[62ch] flex-col gap-3">
            {lesson.segments.map((segment, index) => (
              <p key={segment.id} className="text-base leading-7 text-text-strong-950">
                <SegmentText segment={segment} pad={index > 0} onEnterLine={onEnterLine} />
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-display text-lg font-extrabold text-text-strong-950">
            Teach this move when you want it.
          </h3>
          <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">
            The board and the move marks are already here. I’ll write this position when you ask.
          </p>
          {error ? (
            <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">{error}</p>
          ) : null}
          <Button.Root type="button" className="mt-4 w-fit" disabled={lessonLoading} onClick={onTeach}>
            {lessonLoading ? 'Writing this ply…' : 'Teach this position'}
          </Button.Root>
        </div>
      )}

      {lesson && lesson.alternatives.length > 0 ? (
        <div>
          <p className="font-mono text-sm text-text-sub-600">Explore</p>
          <ul className="mt-2 flex flex-col gap-2">
            {lesson.alternatives.map((line) => (
              <li key={line.uci}>
                <button
                  type="button"
                  onClick={() => onEnterLine(line.pvUci.length > 0 ? line.pvUci : [line.uci])}
                  className="w-full border-2 border-ink bg-bg-weak-50 px-3 py-2 text-left hover:bg-bg-white-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="font-mono text-sm font-bold">{line.san}</span>
                  <span className="mt-1 block text-sm leading-6 text-text-strong-950">{line.why}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {lesson && lesson.sources.length > 0 ? (
        <details className="border-2 border-ink bg-bg-weak-50 px-3 py-2">
          <summary className="cursor-pointer font-mono text-sm text-text-strong-950">
            How coaches talk about this
          </summary>
          <ul className="mt-3 space-y-2">
            {lesson.sources.map((hit) => (
              <li
                key={`${hit.videoId}-${hit.tSec}`}
                className="border-l-4 border-ink pl-3 text-sm leading-6 text-text-sub-600"
              >
                <span className="font-mono text-text-strong-950">{SPEAKER_LABEL[hit.speaker]}</span>
                {' — '}
                <a
                  href={`https://www.youtube.com/watch?v=${hit.videoId}&t=${Math.floor(hit.tSec)}s`}
                  className="underline decoration-2 underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  {hit.title}
                </a>
                <span className="mt-1 block text-text-strong-950">“{hit.quote}”</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <AskForm
        question={question}
        setQuestion={setQuestion}
        asking={asking || lessonLoading}
        onAsk={onAsk}
      />
    </section>
  );
}

function GameBriefBlock({
  brief,
  compact,
  onSelectPly,
}: {
  brief: GameBrief;
  compact: boolean;
  onSelectPly: (ply: number) => void;
}) {
  const keyPlies =
    brief.keyPlies.length > 0 ? (
      <ul className="mt-3 flex flex-wrap gap-2">
        {brief.keyPlies.map((item) => (
          <li key={`${item.ply}-${item.san}`}>
            <button
              type="button"
              className="border-2 border-ink bg-bg-weak-50 px-2 py-1 font-mono text-sm hover:bg-bg-white-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              onClick={() => onSelectPly(item.ply)}
            >
              {item.san}
              <span className="mt-1 block font-sans text-text-sub-600">{item.why}</span>
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  if (compact) {
    return (
      <details className="border-2 border-ink bg-bg-weak-50 px-3 py-2">
        <summary className="cursor-pointer font-display text-sm font-bold">{brief.headline}</summary>
        <p className="mt-2 max-w-[62ch] text-sm leading-6 text-text-strong-950">{brief.story}</p>
        {keyPlies}
      </details>
    );
  }

  return (
    <div className="max-w-[62ch]">
      <h2 className="font-display text-xl font-extrabold text-text-strong-950">{brief.headline}</h2>
      <p className="mt-2 text-sm leading-6 text-text-strong-950">{brief.story}</p>
      {keyPlies}
    </div>
  );
}

function AskForm({
  question,
  setQuestion,
  asking,
  onAsk,
}: {
  question: string;
  setQuestion: (value: string) => void;
  asking: boolean;
  onAsk: (question: string) => void;
}) {
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const next = question.trim();
        if (!next || asking) return;
        onAsk(next);
        setQuestion('');
      }}
    >
      <Input.Root className="flex-1">
        <Input.Wrapper>
          <Input.Icon as={RiQuestionLine} />
          <Input.Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            placeholder="Ask about this position"
            aria-label="Ask about this position"
            disabled={asking}
          />
        </Input.Wrapper>
      </Input.Root>
      <Button.Root type="submit" className="w-full sm:w-fit" disabled={asking || question.trim().length === 0}>
        Ask
      </Button.Root>
    </form>
  );
}

function SegmentText({
  segment,
  pad,
  onEnterLine,
}: {
  segment: LessonSegment;
  pad: boolean;
  onEnterLine: (uci: string[]) => void;
}) {
  const clickable = Boolean(segment.lineUci && segment.lineUci.length > 0);
  const className = cn(
    pad && 'ml-1',
    clickable && 'cursor-pointer font-medium underline decoration-2 underline-offset-4',
  );
  if (!clickable) {
    return <span className={className}>{segment.text}</span>;
  }
  return (
    <button
      type="button"
      className={cn(className, 'bg-transparent p-0 text-left text-inherit')}
      onClick={() => onEnterLine(segment.lineUci ?? [])}
    >
      {segment.text}
    </button>
  );
}
