import { applyUciLine } from '@peakelo/engine';
import {
  DRILL_HIT_SPACING_MS,
  LESSON_MODEL,
  OVERLOOKED_LABEL,
  REINFORCE_RECENT_GAMES,
  TRAINING_FOCUS_LABELS,
  drillsQuerySchema,
  idleWriteup,
  lessonSchema,
  paginate,
  publicRoadmapSchema,
  writeupSchema,
  type BareProfile,
  type CourseSkillBand,
  type DrillAskRequest,
  type DrillKind,
  type DrillMoveBody,
  type DrillPlay,
  type PublicCoachProfile,
  type PublicDrill,
  type PublicRoadmap,
  type PublicWriteup,
  type TrainingDesk,
  type TrainingFocus,
  type TrainingProgress,
  type Writeup,
} from '@peakelo/shared';
import type { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, ServiceUnavailableError } from '../../common/errors';
import { env } from '../../config/env';
import { getPrisma } from '../../db/prisma';
import { logger } from '../../lib/logger';
import { resolveGameRatings } from '../games/service';
import {
  generateLessonWithAgent,
  isLessonConfigured,
  parseGeneratedLesson,
  type GenerateLesson,
} from '../lesson/agent';
import { levelGuidance } from '../lesson/level';
import { formatVoiceExamples, loadTeachingIndex, pickVoiceExamples, resolveTeachingPath } from '../lesson/teaching';
import { parseAnalysisPlies, parseBareSnapshot, toEnginePass } from '../profile/service';
import { generateWriteupWithAgent, isWriteupConfigured, parseGeneratedWriteup, type GenerateWriteup } from './agent';
import { destsForFen, gradeDrillMove, type EngineLine } from './grade';
import { hitInsight, missInsight } from './insights';
import { kindFromStepId, resolveTrainingFocus } from './kinds';
import { applyReinforcement, countRecentLeaks, recentGameIds, shouldAddMoreDrills } from './reinforce';
import { requestEngineLines } from '../lesson/tools';
import { getDefaultAdapter } from '../engine';
import { draftsFromCitations, drillKey, materializeSyllabus, type AnalysisLookup } from './materialize';

export type TrainingDeps = {
  isConfigured?: () => boolean;
  generateWriteup?: GenerateWriteup;
  generateLesson?: GenerateLesson;
  engineLines?: (fen: string) => Promise<EngineLine[]>;
};

export async function getPublicWriteup(userId: string): Promise<PublicWriteup> {
  const row = await getPrisma().profileWriteup.findUnique({ where: { userId } });
  if (!row) return idleWriteup();
  const parsed = row.payload ? writeupSchema.safeParse(row.payload) : null;
  return {
    status: row.status,
    document: parsed?.success ? parsed.data : null,
    error: row.error,
    generatedAt: row.generatedAt?.toISOString() ?? null,
    model: row.model,
  };
}

export async function getCoachProfile(userId: string): Promise<PublicCoachProfile> {
  const row = await getPrisma().enginePass.findUnique({ where: { userId } });
  return {
    pass: toEnginePass(row),
    profile: parseBareSnapshot(row?.snapshot ?? null),
    writeup: await getPublicWriteup(userId),
  };
}

export async function getTrainingDesk(userId: string): Promise<TrainingDesk> {
  const [writeup, roadmap, dueDrills, progress] = await Promise.all([
    getPublicWriteup(userId),
    getRoadmap(userId),
    listDueDrills(userId, 8),
    getProgress(userId),
  ]);
  return { writeup, roadmap, dueDrills, progress };
}

export async function getRoadmap(userId: string): Promise<PublicRoadmap | null> {
  const row = await getPrisma().roadmap.findUnique({ where: { userId } });
  if (!row) return null;
  const parsed = publicRoadmapSchema.safeParse(row.payload);
  return parsed.success ? parsed.data : null;
}

export async function queueWriteup(userId: string, refresh = false): Promise<PublicWriteup> {
  if (!isWriteupConfigured()) {
    throw new ServiceUnavailableError('The lesson coach is offline right now.');
  }
  const prisma = getPrisma();
  const pass = await prisma.enginePass.findUnique({ where: { userId } });
  const snapshot = parseBareSnapshot(pass?.snapshot ?? null);
  if (!snapshot || pass?.status !== 'ready') {
    throw new BadRequestError('Wait for the engine pass before writing the profile');
  }
  const current = await prisma.profileWriteup.findUnique({ where: { userId } });
  if (current?.status === 'ready' && !refresh) return getPublicWriteup(userId);
  if (current?.status === 'running' && !refresh) return getPublicWriteup(userId);
  if (current?.status === 'queued' && !refresh) return getPublicWriteup(userId);
  await prisma.profileWriteup.upsert({
    where: { userId },
    create: { userId, status: 'queued', error: null },
    update: { status: 'queued', error: null },
  });
  return getPublicWriteup(userId);
}

export async function recoverInterruptedWriteups(): Promise<number> {
  const result = await getPrisma().profileWriteup.updateMany({
    where: { status: 'running' },
    data: { status: 'queued' },
  });
  return result.count;
}

export async function runTrainingTick(deps: TrainingDeps = {}): Promise<number> {
  const prisma = getPrisma();
  const queued = await prisma.profileWriteup.findFirst({
    where: { status: 'queued' },
    orderBy: { updatedAt: 'asc' },
  });
  if (!queued) return 0;
  const claimed = await prisma.profileWriteup.updateMany({
    where: { userId: queued.userId, status: 'queued' },
    data: { status: 'running', error: null },
  });
  if (claimed.count !== 1) return 0;
  try {
    await generateAndStore(queued.userId, deps);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The writeup failed.';
    logger.error({ err: error, userId: queued.userId }, 'writeup generation failed');
    await prisma.profileWriteup.update({
      where: { userId: queued.userId },
      data: { status: 'failed', error: message.slice(0, 500) },
    });
  }
  return 1;
}

export async function listDrills(userId: string, query: Record<string, unknown>) {
  const parsed = drillsQuerySchema.parse(query);
  const where = {
    userId,
    ...(parsed.kind ? { kind: parsed.kind } : {}),
    ...(parsed.status === 'all'
      ? { status: { not: 'retired' as const } }
      : parsed.status === 'done'
        ? { status: 'done' as const }
        : { status: { in: ['due' as const, 'assigned' as const] } }),
  };
  const [total, rows] = await Promise.all([
    getPrisma().drill.count({ where }),
    getPrisma().drill.findMany({
      where,
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
    }),
  ]);
  return paginate(rows.map(toPublicDrill), total, parsed);
}

export async function getDrillPlay(userId: string, drillId: string): Promise<DrillPlay> {
  const drill = await requireDrill(userId, drillId);
  const fen = drill.fen;
  const dests = destsForFen(fen);
  return {
    ...toPublicDrill(drill),
    dests: dests.dests,
    sideToMove: dests.sideToMove,
    playedUci: [],
    playedSan: [],
    solved: drill.status === 'done',
    insight: null,
    eval: await storedDrillEval(userId, drill.sourceGameId, drill.sourcePly),
  };
}

export async function playDrillMove(
  userId: string,
  drillId: string,
  body: DrillMoveBody,
  deps: TrainingDeps = {},
) {
  const drill = await requireDrill(userId, drillId);
  const band = await playerBand(userId);
  const lines = deps.engineLines
    ? await deps.engineLines(applyUciLine(drill.fen, body.playedUci).fen)
    : await safeEngineLines(applyUciLine(drill.fen, body.playedUci).fen);
  const why = (await getRoadmap(userId))?.steps.find((step) => step.id === drill.stepId)?.why ?? drill.stem;
  const result = gradeDrillMove({
    startFen: drill.fen,
    goalUci: drill.goalUci,
    playedUci: body.playedUci,
    moveUci: body.uci,
    kind: drill.kind,
    missInsight: missInsight({
      kind: drill.kind,
      band,
      playedSan: applyUciLine(applyUciLine(drill.fen, body.playedUci).fen, [body.uci]).plies[0]?.san ?? body.uci,
      bestSan: drill.goalSan[body.playedUci.length] ?? drill.goalSan[0] ?? 'the save',
      bestUci: drill.goalUci[body.playedUci.length] ?? drill.goalUci[0] ?? body.uci,
      why,
    }),
    hitInsight: hitInsight({
      kind: drill.kind,
      band,
      bestSan: drill.goalSan[0] ?? 'the save',
      why,
    }),
    engineLines: lines,
  });

  if (result.result === 'hit' || result.result === 'miss') {
    await recordAttempt(userId, drill, result.result === 'hit' ? 'hit' : 'miss', result.playedUci);
    if (result.result === 'hit' || result.result === 'miss') {
      await reinforceUser(userId);
    }
  }
  return result;
}

export async function askDrill(
  userId: string,
  drillId: string,
  request: DrillAskRequest,
  deps: TrainingDeps = {},
) {
  const configured = deps.isConfigured ?? isLessonConfigured;
  if (!configured()) {
    throw new ServiceUnavailableError('The lesson coach is offline right now.');
  }
  const drill = await requireDrill(userId, drillId);
  const applied = applyUciLine(drill.fen, request.playedUci ?? []);
  const fen = applied.legal ? applied.fen : drill.fen;
  const generate = deps.generateLesson ?? generateLessonWithAgent;
  const rating = await playerRating(userId);
  const voice = formatVoiceExamples(
    pickVoiceExamples(loadTeachingIndex(resolveTeachingPath(env.SLOW_RUN_INDEX_PATH)), ['hanging', 'idea'], 2),
  );
  const object = await generate({
    userMessage: [
      `This is a drill, not a full game lesson.`,
      `Stem: ${drill.stem}`,
      `FEN: ${fen}`,
      `Student color: ${drill.playerColor}`,
      `Kind: ${drill.kind}`,
      `Stored goal SAN: ${drill.goalSan.join(' ')}`,
      levelGuidance(rating),
      voice,
      'Stay on this FEN. Do not invent eval. If they ask for the answer, teach the idea, then the move.',
    ].join('\n'),
    history: request.history,
    question: request.question,
  });
  return lessonSchema.parse(parseGeneratedLesson(object));
}

export async function generateAndStore(userId: string, deps: TrainingDeps = {}): Promise<void> {
  const configured = deps.isConfigured ?? isWriteupConfigured;
  const prisma = getPrisma();
  const pass = await prisma.enginePass.findUnique({ where: { userId } });
  const snapshot = parseBareSnapshot(pass?.snapshot ?? null);
  if (!snapshot) throw new BadRequestError('No snapshot to write from');

  const [games, analyses, onboarding] = await Promise.all([
    prisma.game.findMany({ where: { userId }, orderBy: { playedAt: 'desc' } }),
    prisma.gameAnalysis.findMany({ where: { userId, status: 'ready' } }),
    prisma.onboarding.findUnique({ where: { userId } }),
  ]);
  const rating = playerRatingFromGames(games);
  const requested = (onboarding?.trainingFocus ?? 'unknown') as TrainingFocus;
  const goal = resolveTrainingFocus(requested, snapshot);
  const lookup = analysisLookup(analyses);
  if (!deps.generateWriteup && !configured()) {
    throw new ServiceUnavailableError('The lesson coach is offline right now.');
  }
  const generate = deps.generateWriteup ?? generateWriteupWithAgent;
  let writeup: Writeup;
  try {
    writeup = parseGeneratedWriteup(
      await generate({
        userMessage: buildWriteupMessage({
          snapshot,
          rating,
          requested,
          goal,
          games: games.length,
        }),
      }),
      snapshot,
    );
  } catch (error) {
    logger.error({ err: error, userId }, 'writeup agent failed');
    throw error instanceof ServiceUnavailableError
      ? error
      : new ServiceUnavailableError('The lesson coach could not finish this writeup.');
  }

  const existing = await prisma.drill.findMany({
    where: { userId, status: { not: 'retired' } },
    select: { sourceGameId: true, sourcePly: true, kind: true },
  });
  const syllabus = materializeSyllabus({
    writeup,
    snapshot,
    analyses: lookup,
    band: rating?.band ?? 'from1200to1600',
    goal,
    existingKeys: new Set(existing.map((row) => drillKey(row))),
  });

  const now = new Date();
  for (const step of syllabus.steps) {
    for (const draft of step.drafts) {
      await prisma.drill.upsert({
        where: {
          userId_sourceGameId_sourcePly_kind: {
            userId,
            sourceGameId: draft.sourceGameId,
            sourcePly: draft.sourcePly,
            kind: draft.kind,
          },
        },
        create: {
          userId,
          kind: draft.kind,
          stepId: draft.stepId,
          fen: draft.fen,
          playerColor: draft.playerColor,
          sourceGameId: draft.sourceGameId,
          sourcePly: draft.sourcePly,
          stem: draft.stem,
          goalUci: draft.goalUci,
          goalSan: draft.goalSan,
          leak: draft.leak,
          status: 'due',
          dueAt: now,
        },
        update: {
          stem: draft.stem,
          goalUci: draft.goalUci,
          goalSan: draft.goalSan,
        },
      });
    }
  }

  const drills = await prisma.drill.findMany({
    where: { userId, status: { not: 'retired' } },
    select: { id: true, stepId: true },
  });
  const byStep = new Map<string, string[]>();
  for (const drill of drills) {
    const list = byStep.get(drill.stepId) ?? [];
    list.push(drill.id);
    byStep.set(drill.stepId, list);
  }

  const roadmap: PublicRoadmap = {
    goldRule: syllabus.goldRule,
    goal,
    generatedAt: now.toISOString(),
    steps: syllabus.steps.map((step, index) => ({
      id: step.id,
      kind: step.kind,
      title: step.title,
      why: step.why,
      doneWhen: step.doneWhen,
      status: index === 0 ? 'current' : 'upcoming',
      evidenceGameIds: step.evidenceGameIds,
      drillIds: byStep.get(step.id) ?? [],
      leak: step.leak,
    })),
  };

  await prisma.$transaction([
    prisma.profileWriteup.upsert({
      where: { userId },
      create: {
        userId,
        status: 'ready',
        payload: writeup as Prisma.InputJsonValue,
        model: env.LESSON_MODEL ?? LESSON_MODEL,
        generatedAt: now,
        error: null,
      },
      update: {
        status: 'ready',
        payload: writeup as Prisma.InputJsonValue,
        model: env.LESSON_MODEL ?? LESSON_MODEL,
        generatedAt: now,
        error: null,
      },
    }),
    prisma.roadmap.upsert({
      where: { userId },
      create: { userId, payload: roadmap as Prisma.InputJsonValue, generatedAt: now },
      update: { payload: roadmap as Prisma.InputJsonValue, generatedAt: now },
    }),
  ]);
}

export async function reinforceUser(userId: string): Promise<void> {
  const prisma = getPrisma();
  const [pass, roadmapRow, games] = await Promise.all([
    prisma.enginePass.findUnique({ where: { userId } }),
    prisma.roadmap.findUnique({ where: { userId } }),
    prisma.game.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: REINFORCE_RECENT_GAMES,
      select: { id: true },
    }),
  ]);
  const snapshot = parseBareSnapshot(pass?.snapshot ?? null);
  const parsed = roadmapRow ? publicRoadmapSchema.safeParse(roadmapRow.payload) : null;
  if (!snapshot || !parsed?.success) return;

  const leaks = countRecentLeaks(snapshot, recentGameIds(games));
  const drills = await prisma.drill.findMany({ where: { userId, status: { not: 'retired' } } });
  const hitsByStep = new Map<string, number>();
  for (const drill of drills) {
    hitsByStep.set(drill.stepId, (hitsByStep.get(drill.stepId) ?? 0) + drill.hitCount);
  }
  const nextRoadmap = applyReinforcement({ roadmap: parsed.data, leaks, hitsByStep });

  for (const step of nextRoadmap.steps) {
    if (step.status === 'done') {
      await prisma.drill.updateMany({
        where: { userId, stepId: step.id, status: { in: ['due', 'assigned'] } },
        data: { status: 'retired' },
      });
    }
    const dueCount = drills.filter((drill) => drill.stepId === step.id && drill.status === 'due').length;
    if (shouldAddMoreDrills(step, leaks, dueCount) && snapshot) {
      await addDrillsFromSnapshot(userId, snapshot, step.kind, step.id);
    }
  }

  await prisma.roadmap.update({
    where: { userId },
    data: { payload: nextRoadmap as Prisma.InputJsonValue },
  });
}

async function addDrillsFromSnapshot(
  userId: string,
  snapshot: BareProfile,
  kind: DrillKind,
  stepId: string,
) {
  const prisma = getPrisma();
  const [analyses, existing, writeupRow, roadmap] = await Promise.all([
    prisma.gameAnalysis.findMany({ where: { userId, status: 'ready' } }),
    prisma.drill.findMany({
      where: { userId },
      select: { sourceGameId: true, sourcePly: true, kind: true },
    }),
    prisma.profileWriteup.findUnique({ where: { userId } }),
    getRoadmap(userId),
  ]);
  const parsed = writeupRow?.payload ? writeupSchema.safeParse(writeupRow.payload) : null;
  if (!parsed?.success) return;

  const nowItem =
    parsed.data.now.find((item) => item.stepId === stepId) ??
    parsed.data.now.find((item) => kindFromStepId(item.stepId) === kind);
  const step = roadmap?.steps.find((item) => item.id === stepId);
  const why = nowItem?.why ?? step?.why;
  if (!why) return;

  const leakCitations =
    step?.leak != null
      ? (snapshot.mistakes.find((group) => group.overlooked === step.leak)?.citations ?? [])
      : [];
  const citations = [...(nowItem?.citations ?? []), ...leakCitations];
  const drafts = draftsFromCitations({
    citations,
    kind,
    stepId,
    why,
    analyses: analysisLookup(analyses),
    existingKeys: new Set(existing.map((row) => drillKey(row))),
  });
  const now = new Date();
  for (const draft of drafts) {
    await prisma.drill.create({
      data: {
        userId,
        kind,
        stepId,
        fen: draft.fen,
        playerColor: draft.playerColor,
        sourceGameId: draft.sourceGameId,
        sourcePly: draft.sourcePly,
        stem: draft.stem,
        goalUci: draft.goalUci,
        goalSan: draft.goalSan,
        leak: draft.leak,
        status: 'due',
        dueAt: now,
      },
    });
  }
}

async function recordAttempt(
  userId: string,
  drill: { id: string; hitCount: number; attemptCount: number },
  result: 'hit' | 'miss',
  playedUci: string[],
) {
  const now = new Date();
  await getPrisma().drillAttempt.create({
    data: { drillId: drill.id, userId, playedUci, result },
  });
  await getPrisma().drill.update({
    where: { id: drill.id },
    data: {
      lastAttemptAt: now,
      lastResult: result,
      attemptCount: { increment: 1 },
      hitCount: result === 'hit' ? { increment: 1 } : undefined,
      status: result === 'hit' ? 'done' : 'due',
      dueAt: result === 'hit' ? new Date(now.getTime() + DRILL_HIT_SPACING_MS) : now,
    },
  });
}

async function getProgress(userId: string): Promise<TrainingProgress> {
  const [onboarding, roadmap, due, weekHits, snapshot] = await Promise.all([
    getPrisma().onboarding.findUnique({ where: { userId } }),
    getRoadmap(userId),
    getPrisma().drill.count({ where: { userId, status: 'due' } }),
    getPrisma().drillAttempt.count({
      where: {
        userId,
        result: 'hit',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    getPrisma().enginePass.findUnique({ where: { userId } }),
  ]);
  const games = await getPrisma().game.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
    take: REINFORCE_RECENT_GAMES,
    select: { id: true },
  });
  const bare = parseBareSnapshot(snapshot?.snapshot ?? null);
  const requested = (onboarding?.trainingFocus ?? 'unknown') as TrainingFocus;
  const goal =
    roadmap?.goal && roadmap.goal !== 'unknown'
      ? roadmap.goal
      : bare
        ? resolveTrainingFocus(requested, bare)
        : requested === 'unknown'
          ? 'rating'
          : requested;
  const leaks = bare ? countRecentLeaks(bare, recentGameIds(games)).filter((item) => item.recentCount > 0) : [];
  const next = await getPrisma().drill.findFirst({
    where: { userId, status: 'due' },
    orderBy: { dueAt: 'asc' },
  });
  const steps = roadmap?.steps ?? [];
  return {
    goal,
    goalLabel: roadmap?.goldRule ?? TRAINING_FOCUS_LABELS[goal === 'unknown' ? 'rating' : goal],
    stepsDone: steps.filter((step) => step.status === 'done').length,
    stepsTotal: steps.length,
    drillsDue: due,
    drillsDoneThisWeek: weekHits,
    leaksStillPresent: leaks.map((item) => ({
      overlooked: item.overlooked,
      label: OVERLOOKED_LABEL[item.overlooked],
      recentCount: item.recentCount,
    })),
    nextDrill: next ? { id: next.id, stem: next.stem, kind: next.kind } : null,
  };
}

async function listDueDrills(userId: string, take: number): Promise<PublicDrill[]> {
  const rows = await getPrisma().drill.findMany({
    where: { userId, status: 'due' },
    orderBy: { dueAt: 'asc' },
    take,
  });
  return rows.map(toPublicDrill);
}

async function requireDrill(userId: string, drillId: string) {
  const drill = await getPrisma().drill.findFirst({ where: { id: drillId, userId } });
  if (!drill) throw new NotFoundError('Drill');
  return drill;
}

function toPublicDrill(row: {
  id: string;
  kind: DrillKind;
  stepId: string;
  fen: string;
  playerColor: string;
  sourceGameId: string;
  sourcePly: number;
  stem: string;
  status: PublicDrill['status'];
  dueAt: Date | null;
  lastAttemptAt: Date | null;
  lastResult: PublicDrill['lastResult'];
  attemptCount: number;
  hitCount: number;
}): PublicDrill {
  return {
    id: row.id,
    kind: row.kind,
    stepId: row.stepId,
    fen: row.fen,
    playerColor: row.playerColor === 'black' ? 'black' : 'white',
    sourceGameId: row.sourceGameId,
    sourcePly: row.sourcePly,
    stem: row.stem,
    status: row.status,
    dueAt: row.dueAt?.toISOString() ?? null,
    lastAttemptAt: row.lastAttemptAt?.toISOString() ?? null,
    lastResult: row.lastResult,
    attemptCount: row.attemptCount,
    hitCount: row.hitCount,
  };
}

function analysisLookup(rows: Array<{ gameId: string; plies: Prisma.JsonValue | null }>): AnalysisLookup {
  const map: AnalysisLookup = new Map();
  for (const row of rows) {
    map.set(row.gameId, parseAnalysisPlies(row.plies));
  }
  return map;
}

function playerRatingFromGames(
  games: Array<{
    source: 'chesscom' | 'lichess';
    timeControl: 'bullet' | 'blitz' | 'rapid';
    userColor: string;
    pgn: string;
    whiteRating: number | null;
    blackRating: number | null;
  }>,
) {
  const ratings = games
    .map((game) => resolveGameRatings(game).player)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (ratings.length === 0) return null;
  const sorted = [...ratings].sort((a, b) => a.rating - b.rating);
  return sorted[Math.floor(sorted.length / 2)] ?? null;
}

async function playerRating(userId: string) {
  const games = await getPrisma().game.findMany({
    where: { userId },
    orderBy: { playedAt: 'desc' },
    take: 20,
  });
  return playerRatingFromGames(games);
}

async function playerBand(userId: string): Promise<CourseSkillBand> {
  return (await playerRating(userId))?.band ?? 'from1200to1600';
}

async function safeEngineLines(fen: string): Promise<EngineLine[]> {
  try {
    const result = await requestEngineLines({ fen }, getDefaultAdapter());
    return result.lines;
  } catch (error) {
    logger.warn({ err: error }, 'drill engine lines failed');
    return [];
  }
}

function buildWriteupMessage(input: {
  snapshot: BareProfile;
  rating: ReturnType<typeof playerRatingFromGames>;
  requested: TrainingFocus;
  goal: TrainingFocus;
  games: number;
}): string {
  const goalLine =
    input.requested === 'unknown'
      ? `The player picked "I don't know." You must name the work from this snapshot. The highest-leverage leak we resolved is ${input.goal}. Never write the onboarding option text. Never write "I don't know."`
      : `Onboarding goal: ${input.goal} (${TRAINING_FOCUS_LABELS[input.goal]}).`;
  return [
    `Bare snapshot JSON (trust this; do not invent citations):`,
    JSON.stringify(compactSnapshot(input.snapshot)),
    `Games in the pass: ${input.games}.`,
    input.rating
      ? `Stored rating context: ${input.rating.source} ${input.rating.timeControl} ${input.rating.rating} (${input.rating.bandLabel}).`
      : 'No stored rating. Do not invent one.',
    goalLine,
    levelGuidance(input.rating),
    formatVoiceExamples(
      pickVoiceExamples(loadTeachingIndex(resolveTeachingPath(env.SLOW_RUN_INDEX_PATH)), ['hanging', 'idea', 'miss'], 3),
    ),
    'Write like a human coach (Gotham / Naroditsky / ChessBase India): concrete SAN, one leak, one habit. Do not dump CPL tables or "avg CPL" as the sentence. now[] citations are { gameId, ply } from this snapshot only.',
  ].join('\n');
}

async function storedDrillEval(userId: string, gameId: string, ply: number) {
  const analysis = await getPrisma().gameAnalysis.findFirst({
    where: { userId, gameId, status: 'ready' },
    select: { plies: true },
  });
  const stored = parseAnalysisPlies(analysis?.plies ?? null).find((item) => item.ply === ply);
  return stored?.evalBefore ?? null;
}

function compactCitation(citation: BareProfile['mistakes'][number]['citations'][number]) {
  return {
    gameId: citation.gameId,
    ply: citation.ply,
    playedSan: citation.playedSan,
    bestSan: citation.bestSan,
  };
}

export function compactSnapshot(snapshot: BareProfile) {
  return {
    generatedAt: snapshot.generatedAt,
    depth: snapshot.depth,
    games: snapshot.games,
    playerMoves: snapshot.playerMoves,
    byTimeControl: snapshot.byTimeControl,
    asWhite: snapshot.asWhite,
    asBlack: snapshot.asBlack,
    clock: snapshot.clock,
    phases: snapshot.phases,
    mistakes: snapshot.mistakes.slice(0, 6).map((group) => ({
      overlooked: group.overlooked,
      count: group.count,
      avgCpl: Math.round(group.avgCpl),
      citations: group.citations.slice(0, 4).map(compactCitation),
    })),
    openings: snapshot.openings.slice(0, 6).map((row) => ({
      eco: row.eco,
      name: row.name,
      color: row.color,
      games: row.games,
      score: row.score,
      acpl: Math.round(row.acpl),
      citations: row.citations.slice(0, 3).map(compactCitation),
    })),
    structures: snapshot.structures.slice(0, 4).map((row) => ({
      fingerprint: row.fingerprint,
      games: row.games,
      acpl: Math.round(row.acpl),
      citations: row.citations.slice(0, 3).map(compactCitation),
    })),
    tactics: snapshot.tactics.map((row) => ({
      depth: row.depth,
      missed: row.missed,
      citations: row.citations.slice(0, 3).map(compactCitation),
    })),
  };
}

