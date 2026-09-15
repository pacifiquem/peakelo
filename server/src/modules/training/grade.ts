import { applyUciLine, legalDests, sideToMove, uciSquares } from '@peakelo/engine';
import type { DrillInsight, DrillMoveResponse, EvalScore } from '@peakelo/shared';

export type EngineLine = {
  uci: string;
  score: EvalScore;
  pvUci: string[];
};

const ALT_CP_WINDOW = 30;

export function gradeDrillMove(input: {
  startFen: string;
  goalUci: string[];
  playedUci: string[];
  moveUci: string;
  kind: string;
  missInsight: DrillInsight;
  hitInsight: DrillInsight;
  engineLines?: EngineLine[];
}): DrillMoveResponse {
  const before = applyUciLine(input.startFen, input.playedUci);
  if (!before.legal) {
    return miss(input.startFen, input.playedUci, before.plies.map((ply) => ply.san), input.moveUci, input.missInsight);
  }

  const played = applyUciLine(before.fen, [input.moveUci]);
  if (!played.legal || !played.plies[0]) {
    return miss(before.fen, input.playedUci, before.plies.map((ply) => ply.san), input.moveUci, input.missInsight);
  }

  const move = played.plies[0];
  const plyIndex = input.playedUci.length;
  const expected = input.goalUci[plyIndex];
  const accepted = move.uci === expected || isAcceptableAlternative(move.uci, input.engineLines, input.kind);

  if (!accepted) {
    return {
      result: 'miss',
      fen: played.fen,
      dests: {},
      lastMove: squaresOf(move.uci),
      san: move.san,
      playedUci: [...input.playedUci, move.uci],
      playedSan: [...before.plies.map((ply) => ply.san), move.san],
      opponentReply: null,
      insight: withRefutation(input.missInsight, expected, input.engineLines),
      solved: false,
      eval: evalForMove(move.uci, input.engineLines),
    };
  }

  let fen = played.fen;
  let playedUci = [...input.playedUci, move.uci];
  let playedSan = [...before.plies.map((ply) => ply.san), move.san];
  let opponentReply: DrillMoveResponse['opponentReply'] = null;
  const replyUci = input.goalUci[playedUci.length];
  if (replyUci && playedUci.length < input.goalUci.length) {
    const reply = applyUciLine(fen, [replyUci]);
    if (reply.legal && reply.plies[0]) {
      fen = reply.fen;
      playedUci = [...playedUci, reply.plies[0].uci];
      playedSan = [...playedSan, reply.plies[0].san];
      opponentReply = { uci: reply.plies[0].uci, san: reply.plies[0].san };
    }
  }

  const studentLeft = input.goalUci.filter((_, index) => index % 2 === 0).length;
  const studentPlayed = playedUci.filter((_, index) => index % 2 === 0).length;
  const solved = studentPlayed >= studentLeft;

  return {
    result: solved ? 'hit' : 'continue',
    fen,
    dests: solved ? {} : destsRecord(fen),
    lastMove: squaresOf(opponentReply?.uci ?? move.uci),
    san: move.san,
    playedUci,
    playedSan,
    opponentReply,
    insight: solved ? input.hitInsight : null,
    solved,
    eval: evalForMove(move.uci, input.engineLines),
  };
}

export function destsForFen(fen: string) {
  return {
    dests: destsRecord(fen),
    sideToMove: sideToMove(fen) ?? 'white',
  };
}

function destsRecord(fen: string): Record<string, string[]> {
  const dests: Record<string, string[]> = {};
  for (const [from, tos] of Object.entries(legalDests(fen))) {
    if (tos) dests[from] = tos;
  }
  return dests;
}

function isAcceptableAlternative(uci: string, lines: EngineLine[] | undefined, kind: string): boolean {
  if (!lines?.length) return false;
  const best = lines[0];
  if (!best) return false;
  if (uci === best.uci) return true;
  const played = lines.find((line) => line.uci === uci);
  if (!played) return false;
  if (kind !== 'make_plan' && kind !== 'convert_advantage') return false;
  if (best.score.kind !== 'cp' || played.score.kind !== 'cp') return played.score.kind === 'mate';
  return Math.abs(best.score.value - played.score.value) <= ALT_CP_WINDOW;
}

function withRefutation(insight: DrillInsight, expected: string | undefined, lines: EngineLine[] | undefined): DrillInsight {
  const uci = expected ?? lines?.[0]?.uci;
  if (!uci || uci.length < 4) return insight;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  if (insight.arrows.some((arrow) => arrow.from === from && arrow.to === to)) return insight;
  return {
    ...insight,
    arrows: [...insight.arrows, { from, to, brush: 'green' as const }].slice(0, 8),
  };
}

function squaresOf(uci: string): { from: string; to: string } {
  return uciSquares(uci) ?? { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

function miss(
  fen: string,
  playedUci: string[],
  playedSan: string[],
  moveUci: string,
  insight: DrillInsight,
): DrillMoveResponse {
  return {
    result: 'miss',
    fen,
    dests: destsRecord(fen),
    lastMove: squaresOf(moveUci),
    san: '?',
    playedUci,
    playedSan,
    opponentReply: null,
    insight,
    solved: false,
    eval: null,
  };
}

function evalForMove(uci: string, lines: EngineLine[] | undefined): EvalScore | null {
  if (!lines?.length) return null;
  return lines.find((line) => line.uci === uci)?.score ?? null;
}
