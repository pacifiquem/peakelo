import { annotatePly } from '@peakelo/engine';
import {
  gameBriefSchema,
  LESSON_MODEL,
  type AnalyzedPly,
  type GameBrief,
  type PlayerRatingContext,
} from '@peakelo/shared';
import { NotFoundError, ServiceUnavailableError } from '../../common/errors';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { getGame } from '../games/service';
import {
  generateBriefWithAgent,
  isLessonConfigured,
  parseGeneratedBrief,
  type GenerateBrief,
} from './agent';
import { levelGuidance } from './level';

export async function createGameBrief(
  userId: string,
  gameId: string,
  opts: { refresh?: boolean; isConfigured?: () => boolean; generateBrief?: GenerateBrief } = {},
): Promise<GameBrief> {
  const configured = opts.isConfigured ?? isLessonConfigured;
  if (!configured()) {
    throw new ServiceUnavailableError('The lesson coach is offline right now.');
  }
  const game = await getGame(userId, gameId);
  if (!game) throw new NotFoundError('Game');

  if (!opts.refresh) {
    const cached = await readCachedBrief(gameId);
    if (cached) return { ...cached, playerRating: game.playerRating };
  }

  const generate = opts.generateBrief ?? generateBriefWithAgent;
  const raw = await generate({ userMessage: buildBriefMessage(game) });
  const draft = parseGeneratedBrief(raw);
  const brief: GameBrief = { ...draft, playerRating: game.playerRating };
  const parsed = gameBriefSchema.parse(brief);
  await getPrisma().gameBrief.upsert({
    where: { gameId },
    create: { gameId, payload: parsed, model: env.LESSON_MODEL ?? LESSON_MODEL },
    update: { payload: parsed, model: env.LESSON_MODEL ?? LESSON_MODEL },
  });
  return parsed;
}

export async function readCachedBrief(gameId: string): Promise<GameBrief | null> {
  const row = await getPrisma().gameBrief.findUnique({ where: { gameId } });
  if (!row) return null;
  const parsed = gameBriefSchema.safeParse(row.payload);
  return parsed.success ? parsed.data : null;
}

export function buildBriefMessage(game: {
  source: string;
  timeControl: string;
  whiteName: string;
  blackName: string;
  result: string;
  userColor: string;
  playerRating: PlayerRatingContext | null;
  analysis: { status: string; plies: AnalyzedPly[] | null };
}): string {
  const plies = game.analysis.status === 'ready' ? (game.analysis.plies ?? []) : [];
  const playerPlies = plies.filter((ply) => ply.isPlayer);
  const notable = [...playerPlies]
    .sort((a, b) => b.cpl - a.cpl)
    .slice(0, 8)
    .map((ply) => ({
      ply: ply.ply,
      san: ply.san,
      glyph: annotatePly(ply),
      judgment: ply.judgment,
      cpl: ply.cpl,
      overlooked: ply.overlooked,
      bestSan: ply.bestSan,
    }));
  const opening = playerPlies.find((ply) => ply.opening)?.opening ?? plies.find((ply) => ply.opening)?.opening;
  const lines = [
    'Write a whole-game brief for this student. Read the snapshot. Do not invent evals or glyphs.',
    `White ${game.whiteName} vs Black ${game.blackName}. Result ${game.result}. Student played ${game.userColor}.`,
    `Source ${game.source} ${game.timeControl}.`,
    levelGuidance(game.playerRating),
    opening ? `Stored opening: ${opening.eco} ${opening.name}.` : 'No stored opening name.',
    game.analysis.status === 'ready'
      ? `Engine pass is ready. ${playerPlies.length} student plies.`
      : `Engine pass status: ${game.analysis.status}. Do not invent CPL or glyphs.`,
    notable.length > 0
      ? `Highest-CPL student plies (from the pass, not invented):\n${JSON.stringify(notable)}`
      : 'No notable student plies in the pass.',
    'headline: one line about what decided the game.',
    'story: 3–6 sentences. Opening idea, the turning point, what to remember. Fit the skill range.',
    'keyPlies: up to 6 from the snapshot above, with why in one sentence.',
    'decidedBy: one sentence (tactic, clock, endgame, opening leak) only if the snapshot supports it.',
    'opening: stored opening name or null.',
  ];
  return lines.join('\n');
}


