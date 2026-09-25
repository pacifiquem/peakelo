'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { applyUciLine, legalDests, type Square } from '@peakelo/engine';
import { DRILL_KIND_LABEL, type DrillInsight, type DrillPlay, type EvalScore, type Lesson } from '@peakelo/shared';

import { AppShell } from '@/components/app-shell';
import { DrillDesk, fenAfterLine, lastMoveFromUci } from '@/components/drills/drill-desk';
import { KindSetDesk } from '@/components/drills/kind-set-desk';
import { Breadcrumb } from '@/components/dashboard/breadcrumb';
import { DashboardGate } from '@/components/dashboard/dashboard-gate';
import { DashboardWell } from '@/components/dashboard/dashboard-well';
import { EmptyPlate } from '@/components/dashboard/empty-plate';
import * as Button from '@/components/ui/button';
import { showError } from '@/components/ui/toast';
import { drillKindFromSlug, drillKindHref } from '@/lib/drill-kind';
import { askDrill, fetchDrill, fetchTrainingDesk, playDrillMove, trainingErrorMessage } from '@/lib/training';

export default function DrillSessionPage() {
  return (
    <DashboardGate>
      {(user) => (
        <AppShell user={user}>
          <DrillIdRouter />
        </AppShell>
      )}
    </DashboardGate>
  );
}

function DrillIdRouter() {
  const params = useParams<{ id: string }>();
  const kind = drillKindFromSlug(params.id);
  if (kind) return <KindSetDesk kind={kind} />;
  return <Session />;
}

function Session() {
  const params = useParams<{ id: string }>();
  const [drill, setDrill] = useState<DrillPlay | null | undefined>(undefined);
  const [fen, setFen] = useState('');
  const [dests, setDests] = useState<Record<string, string[]>>({});
  const [playedUci, setPlayedUci] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [insight, setInsight] = useState<DrillInsight | null>(null);
  const [solved, setSolved] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<Lesson | null>(null);
  const [history, setHistory] = useState<{ role: 'player' | 'coach'; text: string }[]>([]);
  const [nextHref, setNextHref] = useState('/drills');
  const [evalScore, setEvalScore] = useState<EvalScore | null>(null);

  useEffect(() => {
    void fetchDrill(params.id)
      .then((data) => {
        setDrill(data);
        setFen(data.fen);
        setDests(data.dests);
        setPlayedUci([]);
        setLastMove(null);
        setInsight(null);
        setSolved(data.solved);
        setAnswer(null);
        setHistory([]);
        setEvalScore(data.eval);
        void fetchTrainingDesk()
          .then((desk) => {
            const next = desk.dueDrills.find((item) => item.id !== params.id && item.kind === data.kind);
            setNextHref(next ? `/drills/${next.id}` : drillKindHref(data.kind));
          })
          .catch(() => undefined);
      })
      .catch((err: unknown) => {
        showError(trainingErrorMessage(err));
        setDrill(null);
      });
  }, [params.id]);

  if (drill === undefined) {
    return (
      <DashboardWell size="study">
        <p className="text-text-sub-600">Loading the position…</p>
      </DashboardWell>
    );
  }

  if (drill === null) {
    return (
      <DashboardWell size="study">
        <EmptyPlate
          folio="Drill"
          title="This drill is not on this desk."
          action={
            <Button.Root asChild variant="neutral" mode="stroke" className="w-fit">
              <Link href="/drills">Back to the queue</Link>
            </Button.Root>
          }
        >
          It is missing, or it belongs to another player.
        </EmptyPlate>
      </DashboardWell>
    );
  }

  return (
    <DashboardWell size="study">
      <Breadcrumb
        items={[
          { label: 'Drills', href: '/drills' },
          { label: DRILL_KIND_LABEL[drill.kind], href: drillKindHref(drill.kind) },
          { label: 'This position' },
        ]}
      />
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">One position, one job.</h1>
        <p className="font-mono text-sm text-text-strong-950">
          {DRILL_KIND_LABEL[drill.kind]}
          {solved ? ' · cleared — on your completed list' : ''}
        </p>
      </header>
      <DrillDesk
        drill={drill}
        fen={fen}
        dests={dests}
        lastMove={lastMove}
        insight={insight}
        solved={solved}
        asking={asking}
        answer={answer}
        onMove={(uci) => {
          void playDrillMove(drill.id, { playedUci, uci })
            .then((result) => {
              setFen(result.fen);
              setDests(result.dests);
              setPlayedUci(result.playedUci);
              setLastMove(result.lastMove as { from: Square; to: Square });
              setInsight(result.insight);
              setSolved(result.solved);
              if (result.eval) setEvalScore(result.eval);
            })
            .catch((err: unknown) => showError(trainingErrorMessage(err)));
        }}
        onAsk={(question) => {
          setAsking(true);
          void askDrill(drill.id, { question, playedUci, history })
            .then((next) => {
              setAnswer(next);
              setHistory((current) => [
                ...current,
                { role: 'player', text: question },
                { role: 'coach', text: next.headline },
              ]);
            })
            .catch((err: unknown) => showError(trainingErrorMessage(err)))
            .finally(() => setAsking(false));
        }}
        onRetry={() => {
          setFen(drill.fen);
          setDests(drill.dests);
          setPlayedUci([]);
          setLastMove(null);
          setInsight(null);
          setSolved(false);
          setAnswer(null);
          setEvalScore(drill.eval);
        }}
        evalScore={evalScore}
        nextHref={nextHref}
        onExplore={(line) => {
          const next = applyUciLine(fen, line);
          if (!next.legal || !next.plies[0]) return;
          const after = fenAfterLine(fen, line);
          const destsAfter: Record<string, string[]> = {};
          for (const [from, tos] of Object.entries(legalDests(after))) {
            if (tos) destsAfter[from] = tos;
          }
          setFen(after);
          setDests(destsAfter);
          setPlayedUci((current) => [...current, ...line]);
          setLastMove(lastMoveFromUci(next.plies[0].uci));
        }}
      />
    </DashboardWell>
  );
}
