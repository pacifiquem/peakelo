import type { ReactNode } from 'react';
import Link from 'next/link';
import type { BareProfile, Citation } from '@peakelo/shared';

import {
  formatAvgTimeMs,
  formatCpl,
  formatScore,
  overlookedLabel,
  tacticDepthLabel,
} from '@/lib/engine-pass';
import { cn } from '@/utils/cn';

export function SnapshotDesk({ profile }: { profile: BareProfile }) {
  return (
    <div className="flex flex-col gap-8">
      <p className="font-mono text-sm text-text-strong-950">
        {profile.games} games · {profile.playerMoves} player moves · depth {profile.depth} ·{' '}
        <time dateTime={profile.generatedAt}>
          {new Date(profile.generatedAt).toLocaleString()}
        </time>
      </p>

      <nav aria-label="Snapshot sections" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Anchor href="#record">Record</Anchor>
        <Anchor href="#clock">Clock</Anchor>
        <Anchor href="#mistakes">Mistakes</Anchor>
        <Anchor href="#structures">Structures</Anchor>
        <Anchor href="#tactics">Tactics</Anchor>
      </nav>

      <SnapshotSection id="record" title="Record">
        <div className="flex flex-col gap-6">
          <DataTable
            columns={['Clock', 'Games', 'W', 'L', 'D', 'ACPL', 'Blunders / game']}
            empty="No games in this pass."
            rows={timeControlRows(profile)}
          />
          <DataTable
            columns={['Color', 'Games', 'Score', 'ACPL', 'First moves']}
            empty="No color split."
            rows={[
              colorRow('white', profile.asWhite),
              colorRow('black', profile.asBlack),
            ]}
          />
          <DataTable
            columns={['Phase', 'Moves', 'ACPL', 'Blunders', 'Blunder rate']}
            empty="No phases."
            rows={phaseRows(profile)}
          />
        </div>
      </SnapshotSection>

      <SnapshotSection id="clock" title="Clock">
        <dl className="divide-y-2 divide-ink border-2 border-ink bg-bg-white-0 shadow-regular-xs">
          <ClockRow label="Avg time / move" value={formatAvgTimeMs(profile.clock.avgTimeSpentMs)} />
          <ClockRow label="Blunders under 3s" value={String(profile.clock.blundersUnder3s)} />
          <ClockRow
            label="Blunders with <20s left"
            value={String(profile.clock.blundersWithUnder20sLeft)}
          />
          <ClockRow
            label="Opponent-fast blunders"
            value={String(profile.clock.opponentFastBlunders)}
          />
        </dl>
      </SnapshotSection>

      <SnapshotSection id="mistakes" title="Recurring mistakes">
        <DataTable
          columns={['Overlooked', 'Count', 'Avg CPL', 'Citations']}
          empty="No recurring mistakes in this pass."
          rows={profile.mistakes.map((row) => [
            overlookedLabel(row.overlooked),
            <Mono key="count">{row.count}</Mono>,
            <Mono key="cpl">{formatCpl(row.avgCpl)}</Mono>,
            <CitationLinks key="cites" citations={row.citations} />,
          ])}
        />
      </SnapshotSection>

      <SnapshotSection id="structures" title="Structures and lines">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="mb-3 font-display text-lg font-bold">Openings</h3>
            <DataTable
              columns={['Name', 'ECO', 'Color', 'Games', 'Score', 'ACPL', 'Blunders', 'Citations']}
              empty="No openings in this pass."
              rows={profile.openings.map((row) => [
                row.name,
                <Mono key="eco">{row.eco}</Mono>,
                row.color,
                <Mono key="games">{row.games}</Mono>,
                <Mono key="score">{formatScore(row.score)}</Mono>,
                <Mono key="acpl">{formatCpl(row.acpl)}</Mono>,
                <Mono key="blunders">{row.blunders}</Mono>,
                <CitationLinks key="cites" citations={row.citations} />,
              ])}
            />
          </div>
          <div>
            <h3 className="mb-3 font-display text-lg font-bold">Pawn structures</h3>
            <DataTable
              columns={['Fingerprint', 'Games', 'ACPL', 'Blunders', 'Citations']}
              empty="No pawn-structure fingerprints in this pass."
              rows={profile.structures.map((row) => [
                <span key="fp" className="break-all font-mono text-sm">
                  {row.fingerprint}
                </span>,
                <Mono key="games">{row.games}</Mono>,
                <Mono key="acpl">{formatCpl(row.acpl)}</Mono>,
                <Mono key="blunders">{row.blunders}</Mono>,
                <CitationLinks key="cites" citations={row.citations} />,
              ])}
            />
          </div>
        </div>
      </SnapshotSection>

      <SnapshotSection id="tactics" title="Tactics">
        <DataTable
          columns={['Depth', 'Missed', 'Citations']}
          empty="No missed tactics in this pass."
          rows={profile.tactics.map((row) => [
            <Mono key="depth">{tacticDepthLabel(row.depth)}</Mono>,
            <Mono key="missed">{row.missed}</Mono>,
            <CitationLinks key="cites" citations={row.citations} />,
          ])}
        />
      </SnapshotSection>
    </div>
  );
}

function timeControlRows(profile: BareProfile): ReactNode[][] {
  return (['bullet', 'blitz', 'rapid'] as const).map((clock) => {
    const row = profile.byTimeControl[clock] ?? {
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      acpl: 0,
      blundersPerGame: 0,
    };
    return [
      clock,
      <Mono key={`${clock}-g`}>{row.games}</Mono>,
      <Mono key={`${clock}-w`}>{row.wins}</Mono>,
      <Mono key={`${clock}-l`}>{row.losses}</Mono>,
      <Mono key={`${clock}-d`}>{row.draws}</Mono>,
      <Mono key={`${clock}-acpl`}>{formatCpl(row.acpl)}</Mono>,
      <Mono key={`${clock}-bpg`}>{formatCpl(row.blundersPerGame)}</Mono>,
    ];
  });
}

function colorRow(
  color: 'white' | 'black',
  side: BareProfile['asWhite'],
): ReactNode[] {
  const first = side.firstMoves
    .map((move) => `${move.san} ${move.games} ${formatScore(move.score)}`)
    .join(' · ');
  return [
    color,
    <Mono key={`${color}-g`}>{side.games}</Mono>,
    <Mono key={`${color}-s`}>{formatScore(side.score)}</Mono>,
    <Mono key={`${color}-a`}>{formatCpl(side.acpl)}</Mono>,
    <Mono key={`${color}-f`}>{first || '—'}</Mono>,
  ];
}

function phaseRows(profile: BareProfile): ReactNode[][] {
  return (['opening', 'middlegame', 'endgame'] as const).map((phase) => {
    const row = profile.phases[phase] ?? {
      moves: 0,
      acpl: 0,
      blunders: 0,
      blunderRate: 0,
    };
    return [
      phase,
      <Mono key={`${phase}-m`}>{row.moves}</Mono>,
      <Mono key={`${phase}-a`}>{formatCpl(row.acpl)}</Mono>,
      <Mono key={`${phase}-b`}>{row.blunders}</Mono>,
      <Mono key={`${phase}-r`}>{formatScore(row.blunderRate)}</Mono>,
    ];
  });
}

function SnapshotSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
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

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="border-2 border-ink bg-bg-white-0 px-4 py-3 text-sm text-text-strong-950 shadow-regular-xs">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border-2 border-ink bg-bg-white-0 shadow-regular-xs">
      <table className="w-full min-w-[36rem] text-left">
        <thead className="border-b-2 border-ink bg-bg-soft-200 font-mono text-sm text-text-strong-950">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-2 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y-2 divide-ink">
          {rows.map((cells, index) => (
            <tr key={index} className="odd:bg-bg-white-0 even:bg-bg-weak-50 align-top">
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-sm text-text-strong-950">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CitationLinks({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) {
    return <span className="text-text-sub-600">None</span>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {citations.map((citation) => (
        <li key={`${citation.gameId}-${citation.ply}-${citation.playedSan}-${citation.bestSan}`}>
          <Link
            href={`/games/${citation.gameId}?ply=${citation.ply}`}
            className="font-mono text-sm underline-offset-4 hover:underline"
          >
            {citation.playedSan}
            <span className="text-text-sub-600"> · best {citation.bestSan}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono">{children}</span>;
}

function Anchor({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className={cn(
        'font-display font-bold underline decoration-2 underline-offset-4',
        'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
      )}
    >
      {children}
    </a>
  );
}