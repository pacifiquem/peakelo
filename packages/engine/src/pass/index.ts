import type { AnalyzedPly, BareProfile, Citation, Overlooked } from '@peakelo/shared';
import { Chess } from 'chessops';
import { parseFen } from 'chessops/fen';
import { makeSan } from 'chessops/san';
import { parseUci } from 'chessops/util';

import { timeSpentMs } from '../clocks';
import { cplFromScores, judgmentFromCpl, type EngineLine } from '../eval';
import { lookupOpening } from '../openings/lookup';
import { combinationDepth, detectOverlooked } from '../overlook';
import { gamePhase } from '../phase';
import { replayPgn } from '../pgn';

export type { EngineLine };

export type PositionEval = {
  lines: EngineLine[];
  played?: EngineLine;
};

const TIME_CONTROLS = ['bullet', 'blitz', 'rapid'] as const;
const PHASES = ['opening', 'middlegame', 'endgame'] as const;

export async function analyzePlayerGame(input: {
  pgn: string;
  userColor: 'white' | 'black';
  evaluate: (fen: string) => Promise<PositionEval>;
}): Promise<{
  plies: AnalyzedPly[];
  opening: { eco: string; name: string } | null;
  playerAcpl: number;
}> {
  const replayed = replayPgn(input.pgn);
  const plies: AnalyzedPly[] = [];
  const lastClock: { white: number | null; black: number | null } = {
    white: replayed.baseTimeMs,
    black: replayed.baseTimeMs,
  };

  for (const ply of replayed.plies) {
    const color: 'white' | 'black' = ply.ply % 2 === 1 ? 'white' : 'black';
    const spent = timeSpentMs(lastClock[color], ply.clockAfterMs, replayed.incrementMs);
    if (ply.clockAfterMs !== null) lastClock[color] = ply.clockAfterMs;

    const before = await input.evaluate(ply.fenBefore);
    const best = before.lines[0] ?? fallbackLine(ply.uci);
    let playedLine = before.lines.find((line) => line.uci === ply.uci);
    if (!playedLine) {
      const after = await input.evaluate(ply.fen);
      playedLine = after.played ?? (after.lines[0] ? { ...after.lines[0], uci: ply.uci } : fallbackLine(ply.uci));
    }

    const second = before.lines[1];
    const cpl = cplFromScores(best.score, playedLine.score, color);
    const judgment = judgmentFromCpl(cpl);
    const opponentPlies = plies.filter((item) => item.color !== color).slice(-3);
    const opponentFast =
      opponentPlies.length > 0 &&
      opponentPlies.every((item) => item.timeSpentMs !== null && item.timeSpentMs < 1500);

    const analyzed: AnalyzedPly = {
      ply: ply.ply,
      san: ply.san,
      uci: ply.uci,
      fenBefore: ply.fenBefore,
      fenAfter: ply.fen,
      color,
      isPlayer: color === input.userColor,
      clockAfterMs: ply.clockAfterMs,
      timeSpentMs: spent,
      evalBefore: plies.at(-1)?.evalAfter ?? best.score,
      evalAfter: playedLine.score,
      bestEval: best.score,
      bestUci: best.uci,
      bestSan: sanFromUci(ply.fenBefore, best.uci),
      ...(second
        ? { secondBestUci: second.uci, secondBestEval: second.score }
        : {}),
      pvUci: best.pvUci,
      pvSan: sansFromUci(ply.fenBefore, best.pvUci, 8),
      cpl,
      judgment,
      phase: gamePhase(ply.fen, ply.ply),
      opening: lookupOpening(ply.fen),
      opponentFast,
      overlooked: detectOverlooked({
        fenBefore: ply.fenBefore,
        playedUci: ply.uci,
        bestUci: best.uci,
        pvUci: best.pvUci,
        judgment,
        timeSpentMs: spent,
        clockAfterMs: ply.clockAfterMs,
        bestScore: best.score,
        playedScore: playedLine.score,
      }),
    };
    plies.push(analyzed);
  }

  const playerCpls = plies.filter((ply) => ply.isPlayer).map((ply) => ply.cpl);
  let opening: { eco: string; name: string } | null = null;
  for (const ply of plies) {
    if (ply.opening) opening = ply.opening;
  }

  return {
    plies,
    opening,
    playerAcpl: mean(playerCpls),
  };
}

export function buildBareProfile(
  games: Array<{
    gameId: string;
    timeControl: 'bullet' | 'blitz' | 'rapid';
    userColor: 'white' | 'black';
    result: '1-0' | '0-1' | '1/2-1/2' | '*';
    plies: AnalyzedPly[];
  }>,
  depth: number,
): BareProfile {
  const byTime = Object.fromEntries(TIME_CONTROLS.map((tc) => [tc, emptyScoreAcc()])) as Record<
    'bullet' | 'blitz' | 'rapid',
    ScoreAcc
  >;
  const asWhite = emptyColorAcc();
  const asBlack = emptyColorAcc();
  const openingGroups = new Map<string, OpeningAcc>();
  const structureGroups = new Map<string, StructureAcc>();
  const mistakeGroups = new Map<Overlooked, MistakeAcc>();
  const tacticGroups = new Map<number, TacticAcc>();
  const phaseGroups = Object.fromEntries(PHASES.map((phase) => [phase, emptyPhaseAcc()])) as Record<
    'opening' | 'middlegame' | 'endgame',
    PhaseAcc
  >;

  let playerMoves = 0;
  const timed: number[] = [];
  let blundersUnder3s = 0;
  let blundersWithUnder20sLeft = 0;
  let opponentFastBlunders = 0;

  for (const game of games) {
    const playerPlies = game.plies.filter((ply) => ply.isPlayer);
    playerMoves += playerPlies.length;
    const outcome = outcomeOf(game.userColor, game.result);
    addScore(byTime[game.timeControl], outcome, playerPlies);
    const side = game.userColor === 'white' ? asWhite : asBlack;
    addScore(side, outcome, playerPlies);
    const first = playerPlies[0];
    if (first) addFirstMove(side, first.san, outcome, playerPlies);

    const opening = lastOpening(game.plies);
    if (opening) {
      const key = `${opening.eco}\0${opening.name}\0${game.userColor}`;
      let group = openingGroups.get(key);
      if (!group) {
        group = {
          eco: opening.eco,
          name: opening.name,
          color: game.userColor,
          games: 0,
          wins: 0,
          draws: 0,
          cpls: [],
          blunders: 0,
          citations: [],
        };
        openingGroups.set(key, group);
      }
      addOpeningGame(group, outcome, playerPlies, game.gameId);
    }

    const fingerprint = gameFingerprint(game.plies);
    if (fingerprint) {
      let group = structureGroups.get(fingerprint);
      if (!group) {
        group = { fingerprint, games: 0, cpls: [], blunders: 0, citations: [] };
        structureGroups.set(fingerprint, group);
      }
      group.games += 1;
      addCpls(group, playerPlies, game.gameId);
    }

    for (const ply of playerPlies) {
      phaseGroups[ply.phase].moves += 1;
      phaseGroups[ply.phase].cpls.push(ply.cpl);
      if (ply.judgment === 'blunder') phaseGroups[ply.phase].blunders += 1;
      if (ply.timeSpentMs !== null) timed.push(ply.timeSpentMs);
      if (ply.judgment === 'blunder') {
        if (ply.timeSpentMs !== null && ply.timeSpentMs < 3000) blundersUnder3s += 1;
        if (ply.clockAfterMs !== null && ply.clockAfterMs < 20_000) blundersWithUnder20sLeft += 1;
        if (ply.opponentFast) opponentFastBlunders += 1;
      }
      for (const tag of ply.overlooked) {
        let group = mistakeGroups.get(tag);
        if (!group) {
          group = { overlooked: tag, cpls: [], citations: [] };
          mistakeGroups.set(tag, group);
        }
        group.cpls.push(ply.cpl);
        pushCitation(group.citations, citationOf(game.gameId, ply));
      }
      if (
        ply.overlooked.includes('missed_combination') ||
        ply.overlooked.includes('missed_mate') ||
        ply.overlooked.includes('missed_capture')
      ) {
        const start = positionFromFen(ply.fenBefore);
        const rawDepth = start ? combinationDepth(start, ply.pvUci) : ply.pvUci.length;
        const bucket = Math.min(4, Math.max(1, rawDepth || 1));
        let group = tacticGroups.get(bucket);
        if (!group) {
          group = { depth: bucket, missed: 0, citations: [] };
          tacticGroups.set(bucket, group);
        }
        group.missed += 1;
        pushCitation(group.citations, citationOf(game.gameId, ply));
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    depth,
    games: games.length,
    playerMoves,
    byTimeControl: {
      bullet: toScoreline(byTime.bullet),
      blitz: toScoreline(byTime.blitz),
      rapid: toScoreline(byTime.rapid),
    },
    asWhite: toColorBlock(asWhite),
    asBlack: toColorBlock(asBlack),
    openings: [...openingGroups.values()]
      .map((group) => ({
        eco: group.eco,
        name: group.name,
        color: group.color,
        games: group.games,
        score: scoreOf(group.wins, group.draws, group.games),
        acpl: mean(group.cpls),
        blunders: group.blunders,
        citations: group.citations.slice(0, 5),
      }))
      .sort((a, b) => b.acpl - a.acpl || b.blunders - a.blunders),
    structures: [...structureGroups.values()]
      .map((group) => ({
        fingerprint: group.fingerprint,
        games: group.games,
        acpl: mean(group.cpls),
        blunders: group.blunders,
        citations: group.citations.slice(0, 5),
      }))
      .sort((a, b) => b.acpl - a.acpl || b.blunders - a.blunders),
    mistakes: [...mistakeGroups.values()]
      .map((group) => ({
        overlooked: group.overlooked,
        count: group.cpls.length,
        avgCpl: mean(group.cpls),
        citations: group.citations.slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count || b.avgCpl - a.avgCpl),
    tactics: [...tacticGroups.values()]
      .map((group) => ({
        depth: group.depth,
        missed: group.missed,
        citations: group.citations.slice(0, 5),
      }))
      .sort((a, b) => a.depth - b.depth),
    clock: {
      avgTimeSpentMs: timed.length === 0 ? null : mean(timed),
      blundersUnder3s,
      blundersWithUnder20sLeft,
      opponentFastBlunders,
    },
    phases: {
      opening: toPhase(phaseGroups.opening),
      middlegame: toPhase(phaseGroups.middlegame),
      endgame: toPhase(phaseGroups.endgame),
    },
  };
}

type Outcome = { win: boolean; loss: boolean; draw: boolean };

type ScoreAcc = {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  cpls: number[];
  blunders: number;
};

type FirstMoveAcc = {
  san: string;
  games: number;
  wins: number;
  draws: number;
  cpls: number[];
};

type ColorAcc = ScoreAcc & { firstMoves: Map<string, FirstMoveAcc> };

type OpeningAcc = {
  eco: string;
  name: string;
  color: 'white' | 'black';
  games: number;
  wins: number;
  draws: number;
  cpls: number[];
  blunders: number;
  citations: Citation[];
};

type StructureAcc = {
  fingerprint: string;
  games: number;
  cpls: number[];
  blunders: number;
  citations: Citation[];
};

type MistakeAcc = {
  overlooked: Overlooked;
  cpls: number[];
  citations: Citation[];
};

type TacticAcc = {
  depth: number;
  missed: number;
  citations: Citation[];
};

type PhaseAcc = {
  moves: number;
  cpls: number[];
  blunders: number;
};

function emptyScoreAcc(): ScoreAcc {
  return { games: 0, wins: 0, losses: 0, draws: 0, cpls: [], blunders: 0 };
}

function emptyColorAcc(): ColorAcc {
  return { ...emptyScoreAcc(), firstMoves: new Map() };
}

function emptyPhaseAcc(): PhaseAcc {
  return { moves: 0, cpls: [], blunders: 0 };
}

function outcomeOf(userColor: 'white' | 'black', result: '1-0' | '0-1' | '1/2-1/2' | '*'): Outcome {
  if (result === '1/2-1/2') return { win: false, loss: false, draw: true };
  if (result === '1-0') return { win: userColor === 'white', loss: userColor === 'black', draw: false };
  if (result === '0-1') return { win: userColor === 'black', loss: userColor === 'white', draw: false };
  return { win: false, loss: false, draw: false };
}

function addScore(acc: ScoreAcc, outcome: Outcome, playerPlies: AnalyzedPly[]): void {
  acc.games += 1;
  if (outcome.win) acc.wins += 1;
  if (outcome.loss) acc.losses += 1;
  if (outcome.draw) acc.draws += 1;
  for (const ply of playerPlies) {
    acc.cpls.push(ply.cpl);
    if (ply.judgment === 'blunder') acc.blunders += 1;
  }
}

function addFirstMove(side: ColorAcc, san: string, outcome: Outcome, playerPlies: AnalyzedPly[]): void {
  let group = side.firstMoves.get(san);
  if (!group) {
    group = { san, games: 0, wins: 0, draws: 0, cpls: [] };
    side.firstMoves.set(san, group);
  }
  group.games += 1;
  if (outcome.win) group.wins += 1;
  if (outcome.draw) group.draws += 1;
  for (const ply of playerPlies) group.cpls.push(ply.cpl);
}

function addOpeningGame(
  group: OpeningAcc,
  outcome: Outcome,
  playerPlies: AnalyzedPly[],
  gameId: string,
): void {
  group.games += 1;
  if (outcome.win) group.wins += 1;
  if (outcome.draw) group.draws += 1;
  addCpls(group, playerPlies, gameId);
}

function addCpls(
  group: { cpls: number[]; blunders: number; citations: Citation[] },
  playerPlies: AnalyzedPly[],
  gameId: string,
): void {
  for (const ply of playerPlies) {
    group.cpls.push(ply.cpl);
    if (ply.judgment === 'blunder') group.blunders += 1;
    if (ply.judgment === 'mistake' || ply.judgment === 'blunder') {
      pushCitation(group.citations, citationOf(gameId, ply));
    }
  }
}

function lastOpening(plies: AnalyzedPly[]): { eco: string; name: string } | null {
  let opening: { eco: string; name: string } | null = null;
  for (const ply of plies) {
    if (ply.opening) opening = ply.opening;
  }
  return opening;
}

function gameFingerprint(plies: AnalyzedPly[]): string | null {
  if (plies.length === 0) return null;
  let chosen = plies[plies.length - 1]!;
  for (let i = plies.length - 1; i >= 0; i -= 1) {
    if (plies[i]!.phase !== 'endgame') {
      chosen = plies[i]!;
      break;
    }
  }
  return pawnFingerprint(chosen.fenAfter);
}

function pawnFingerprint(fen: string): string {
  const board = fen.split(' ')[0] ?? '';
  return board
    .split('/')
    .map((rank) => {
      let empty = 0;
      let out = '';
      const flush = () => {
        if (empty > 0) {
          out += String(empty);
          empty = 0;
        }
      };
      for (const char of rank) {
        if (char === 'P' || char === 'p') {
          flush();
          out += char;
        } else if (char >= '1' && char <= '8') {
          empty += Number(char);
        } else {
          empty += 1;
        }
      }
      flush();
      return out;
    })
    .join('/');
}

function citationOf(gameId: string, ply: AnalyzedPly): Citation {
  return {
    gameId,
    ply: ply.ply,
    san: ply.san,
    playedSan: ply.san,
    bestSan: ply.bestSan,
    fenBefore: ply.fenBefore,
    cpl: ply.cpl,
  };
}

function pushCitation(citations: Citation[], citation: Citation): void {
  citations.push(citation);
  citations.sort((a, b) => b.cpl - a.cpl);
  if (citations.length > 5) citations.length = 5;
}

function toScoreline(acc: ScoreAcc) {
  return {
    games: acc.games,
    wins: acc.wins,
    losses: acc.losses,
    draws: acc.draws,
    acpl: mean(acc.cpls),
    blundersPerGame: acc.games === 0 ? 0 : acc.blunders / acc.games,
  };
}

function toColorBlock(acc: ColorAcc) {
  return {
    games: acc.games,
    score: scoreOf(acc.wins, acc.draws, acc.games),
    acpl: mean(acc.cpls),
    firstMoves: [...acc.firstMoves.values()]
      .map((group) => ({
        san: group.san,
        games: group.games,
        score: scoreOf(group.wins, group.draws, group.games),
        acpl: mean(group.cpls),
      }))
      .sort((a, b) => b.games - a.games || a.san.localeCompare(b.san)),
  };
}

function toPhase(acc: PhaseAcc) {
  return {
    moves: acc.moves,
    acpl: mean(acc.cpls),
    blunders: acc.blunders,
    blunderRate: acc.moves === 0 ? 0 : acc.blunders / acc.moves,
  };
}

function scoreOf(wins: number, draws: number, games: number): number {
  return games === 0 ? 0 : (wins + 0.5 * draws) / games;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fallbackLine(uci: string): EngineLine {
  return { uci, score: { kind: 'cp', value: 0 }, pvUci: [] };
}

function positionFromFen(fen: string): Chess | null {
  const setup = parseFen(fen);
  if (setup.isErr) return null;
  const pos = Chess.fromSetup(setup.value);
  if (pos.isErr) return null;
  return pos.value;
}

function sanFromUci(fen: string, uci: string): string {
  const pos = positionFromFen(fen);
  if (!pos) return '';
  const move = parseUci(uci);
  if (!move || !pos.isLegal(move)) return '';
  return makeSan(pos, move);
}

function sansFromUci(fen: string, ucis: string[], limit: number): string[] {
  const pos = positionFromFen(fen);
  if (!pos) return [];
  const sans: string[] = [];
  for (const uci of ucis.slice(0, limit)) {
    const move = parseUci(uci);
    if (!move || !pos.isLegal(move)) break;
    sans.push(makeSan(pos, move));
    pos.play(move);
  }
  return sans;
}
