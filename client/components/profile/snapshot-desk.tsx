import { useMemo, useState, type ReactNode } from 'react';
import type { BareProfile } from '@peakelo/shared';

import { Pager } from '@/components/dashboard/pager';
import { SectionTabs } from '@/components/dashboard/section-tabs';
import { CitationChips } from '@/components/profile/citation-chips';
import * as Button from '@/components/ui/button';
import * as Input from '@/components/ui/input';
import {
  formatAvgTimeMs,
  formatCpl,
  formatScore,
  overlookedLabel,
  tacticDepthLabel,
} from '@/lib/engine-pass';

const PAGE_SIZE = 8;

export const SNAPSHOT_SECTIONS = [
  { id: 'record', label: 'Record' },
  { id: 'clock', label: 'Clock' },
  { id: 'mistakes', label: 'Mistakes' },
  { id: 'openings', label: 'Openings' },
  { id: 'structures', label: 'Structures' },
  { id: 'tactics', label: 'Tactics' },
] as const;

export type SnapshotSectionId = (typeof SNAPSHOT_SECTIONS)[number]['id'];

export function SnapshotDesk({
  profile,
  section,
  onSection,
}: {
  profile: BareProfile;
  section: SnapshotSectionId;
  onSection: (id: SnapshotSectionId) => void;
}) {
  const current = SNAPSHOT_SECTIONS.some((item) => item.id === section) ? section : 'record';

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-sm text-text-strong-950">
        {profile.games} games · {profile.playerMoves} player moves · depth {profile.depth} ·{' '}
        <time dateTime={profile.generatedAt}>{new Date(profile.generatedAt).toLocaleString()}</time>
      </p>

      <SectionTabs
        label="Snapshot sections"
        sections={SNAPSHOT_SECTIONS}
        value={current}
        onChange={(id) => onSection(id as SnapshotSectionId)}
      />

      {current === 'record' ? <RecordSection profile={profile} /> : null}
      {current === 'clock' ? <ClockSection profile={profile} /> : null}
      {current === 'mistakes' ? <MistakesSection profile={profile} /> : null}
      {current === 'openings' ? <OpeningsSection profile={profile} /> : null}
      {current === 'structures' ? <StructuresSection profile={profile} /> : null}
      {current === 'tactics' ? <TacticsSection profile={profile} /> : null}
    </div>
  );
}

function RecordSection({ profile }: { profile: BareProfile }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(['bullet', 'blitz', 'rapid'] as const).map((clock) => {
        const row = profile.byTimeControl[clock];
        if (!row || row.games === 0) return null;
        return (
          <StatCard
            key={clock}
            title={clock}
            lines={[
              `${row.games} games · ${row.wins}W ${row.losses}L ${row.draws}D`,
              `ACPL ${formatCpl(row.acpl)} · ${formatCpl(row.blundersPerGame)} blunders / game`,
            ]}
          />
        );
      })}
      <StatCard
        title="White"
        lines={[
          `${profile.asWhite.games} games · score ${formatScore(profile.asWhite.score)} · ACPL ${formatCpl(profile.asWhite.acpl)}`,
          firstMovesLine(profile.asWhite.firstMoves),
        ]}
      />
      <StatCard
        title="Black"
        lines={[
          `${profile.asBlack.games} games · score ${formatScore(profile.asBlack.score)} · ACPL ${formatCpl(profile.asBlack.acpl)}`,
          firstMovesLine(profile.asBlack.firstMoves),
        ]}
      />
      {(['opening', 'middlegame', 'endgame'] as const).map((phase) => {
        const row = profile.phases[phase] ?? { moves: 0, acpl: 0, blunders: 0, blunderRate: 0 };
        return (
          <StatCard
            key={phase}
            title={phase}
            lines={[
              `${row.moves} moves · ACPL ${formatCpl(row.acpl)}`,
              `${row.blunders} blunders · rate ${formatScore(row.blunderRate)}`,
            ]}
          />
        );
      })}
    </div>
  );
}

function ClockSection({ profile }: { profile: BareProfile }) {
  return (
    <dl className="divide-y-2 divide-ink border-2 border-ink bg-bg-white-0 shadow-regular-xs">
      <ClockRow label="Avg time / move" value={formatAvgTimeMs(profile.clock.avgTimeSpentMs)} />
      <ClockRow label="Blunders under 3s" value={String(profile.clock.blundersUnder3s)} />
      <ClockRow label="Blunders with <20s left" value={String(profile.clock.blundersWithUnder20sLeft)} />
      <ClockRow label="Opponent-fast blunders" value={String(profile.clock.opponentFastBlunders)} />
    </dl>
  );
}

function MistakesSection({ profile }: { profile: BareProfile }) {
  if (profile.mistakes.length === 0) {
    return <EmptyNote>No recurring mistakes in this pass.</EmptyNote>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {profile.mistakes.map((row) => (
        <li key={row.overlooked} className="border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs">
          <h3 className="font-display text-lg font-extrabold">{overlookedLabel(row.overlooked)}</h3>
          <p className="mt-1 font-mono text-sm">
            {row.count} times · avg CPL {formatCpl(row.avgCpl)}
          </p>
          <CitationChips citations={row.citations} />
        </li>
      ))}
    </ul>
  );
}

function OpeningsSection({ profile }: { profile: BareProfile }) {
  const [color, setColor] = useState<'all' | 'white' | 'black'>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return profile.openings.filter((row) => {
      if (color !== 'all' && row.color !== color) return false;
      if (!needle) return true;
      return row.name.toLowerCase().includes(needle) || row.eco.toLowerCase().includes(needle);
    });
  }, [color, profile.openings, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'white', 'black'] as const).map((item) => (
          <Button.Root
            key={item}
            type="button"
            size="small"
            variant={color === item ? 'primary' : 'neutral'}
            mode={color === item ? 'filled' : 'stroke'}
            className="w-fit capitalize"
            onClick={() => {
              setColor(item);
              setPage(1);
            }}
          >
            {item === 'all' ? 'Both colors' : item}
          </Button.Root>
        ))}
        {profile.openings.length > PAGE_SIZE ? (
          <Input.Root className="w-full sm:ml-auto sm:max-w-xs">
            <Input.Wrapper>
              <Input.Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter by name or ECO"
                aria-label="Filter openings"
              />
            </Input.Wrapper>
          </Input.Root>
        ) : null}
      </div>
      <p className="font-mono text-sm text-text-sub-600">
        {filtered.length} opening{filtered.length === 1 ? '' : 's'} · ranked by ACPL
      </p>
      {slice.length === 0 ? (
        <EmptyNote>No openings matched that filter.</EmptyNote>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {slice.map((row) => (
            <li
              key={`${row.eco}-${row.color}-${row.name}`}
              className="border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs"
            >
              <p className="font-mono text-sm">
                {row.eco} · {row.color}
              </p>
              <h3 className="mt-1 font-display text-lg font-extrabold">{row.name}</h3>
              <p className="mt-1 font-mono text-sm">
                {row.games} games · {formatScore(row.score)} · ACPL {formatCpl(row.acpl)} ·{' '}
                {row.blunders} blunders
              </p>
              <CitationChips citations={row.citations} />
            </li>
          ))}
        </ul>
      )}
      <Pager page={safePage} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

function StructuresSection({ profile }: { profile: BareProfile }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(profile.structures.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = profile.structures.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (profile.structures.length === 0) {
    return <EmptyNote>No pawn-structure fingerprints in this pass.</EmptyNote>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm text-text-sub-600">
        {profile.structures.length} structures · ranked by ACPL
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {slice.map((row) => (
          <li key={row.fingerprint} className="border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs">
            <h3 className="break-all font-mono text-sm font-bold">{row.fingerprint}</h3>
            <p className="mt-2 font-mono text-sm">
              {row.games} games · ACPL {formatCpl(row.acpl)} · {row.blunders} blunders
            </p>
            <CitationChips citations={row.citations} />
          </li>
        ))}
      </ul>
      <Pager page={safePage} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}

function TacticsSection({ profile }: { profile: BareProfile }) {
  if (profile.tactics.length === 0) {
    return <EmptyNote>No missed tactics in this pass.</EmptyNote>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {profile.tactics.map((row) => (
        <li key={row.depth} className="border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs">
          <h3 className="font-display text-lg font-extrabold">
            Depth {tacticDepthLabel(row.depth)}
          </h3>
          <p className="mt-1 font-mono text-sm">{row.missed} missed</p>
          <CitationChips citations={row.citations} />
        </li>
      ))}
    </ul>
  );
}

function StatCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <article className="border-2 border-ink bg-bg-white-0 p-4 shadow-regular-xs">
      <h3 className="font-display text-lg font-extrabold capitalize">{title}</h3>
      {lines.map((line) => (
        <p key={line} className="mt-1 text-sm leading-6 text-text-strong-950">
          {line}
        </p>
      ))}
    </article>
  );
}

function ClockRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3 odd:bg-bg-white-0 even:bg-bg-weak-50">
      <dt className="text-sm text-text-strong-950">{label}</dt>
      <dd className="font-mono text-sm text-text-strong-950">{value}</dd>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-2 border-ink bg-bg-white-0 px-4 py-3 text-sm text-text-strong-950 shadow-regular-xs">
      {children}
    </p>
  );
}

function firstMovesLine(
  moves: BareProfile['asWhite']['firstMoves'],
): string {
  if (moves.length === 0) return 'No first-move sample.';
  return moves
    .slice(0, 4)
    .map((move) => `${move.san} ${move.games} ${formatScore(move.score)}`)
    .join(' · ');
}
