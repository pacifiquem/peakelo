import fs from 'node:fs';

import { replayPgn } from '../../packages/engine/src/pgn';

import { alignTranscript } from './align';
import { parseCli, sleep } from './cli';
import { loadManifest, saveManifest } from './manifest';
import { dedupeCues } from './quotes';
import {
  DATA_ROOT,
  POSITIONS_PATH,
  TEACHING_PATH,
  appendLog,
  ensureDataDirs,
  gamePath,
  transcriptPath,
  videoPath,
} from './paths';
import { extractTeachingBeats } from '../../server/src/modules/lesson/teaching';
import { fetchPgnForUrl } from './pgn-fetch';
import type { Manifest, SlowRunComment, SlowRunIndex, TranscriptCue, VideoRecord } from './types';
import { extractGameUrlsFromVideo } from './urls';

function log(line: string): void {
  console.log(appendLog('index', line));
}

function persist(manifest: Manifest): void {
  try {
    saveManifest(manifest);
  } catch (error) {
    log(`failed to save manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

async function indexOne(
  manifest: Manifest,
  videoId: string,
  force: boolean,
): Promise<SlowRunComment[] | null> {
  const row = manifest.videos[videoId];
  if (!row) return [];
  if (!force && row.indexedAt && typeof row.indexComments === 'number' && row.indexComments >= 0) {
    return null;
  }
  const video = readJson<VideoRecord>(videoPath(videoId));
  const cues = readJson<TranscriptCue[]>(transcriptPath(videoId));
  if (!video || !cues) {
    log(`skip ${videoId}: missing video or transcript`);
    return [];
  }

  const urls = extractGameUrlsFromVideo({
    title: video.title,
    description: video.description,
    cues,
  });
  let pgn: string | null = null;
  let gameUrl: string | undefined;
  if (urls[0]) {
    gameUrl = urls[0].url;
    const existing = !force && fs.existsSync(gamePath(videoId)) ? fs.readFileSync(gamePath(videoId), 'utf8') : '';
    if (existing.trim()) {
      pgn = existing;
    } else {
      pgn = await fetchPgnForUrl(urls[0]);
      if (pgn) fs.writeFileSync(gamePath(videoId), pgn.endsWith('\n') ? pgn : `${pgn}\n`);
      else log(`no pgn for ${videoId} ${urls[0].url}`);
    }
  }

  const replayed = pgn ? replayPgn(pgn) : null;
  const comments = alignTranscript({
    cues: dedupeCues(cues),
    speaker: video.speaker,
    videoId: video.id,
    title: video.title,
    replayed: replayed && replayed.plies.length > 0 ? replayed : null,
    hasGameUrl: Boolean(pgn && gameUrl),
  });

  row.hasPgn = Boolean(pgn);
  row.gameUrl = gameUrl;
  row.indexedAt = new Date().toISOString();
  row.indexComments = comments.length;
  persist(manifest);
  log(`indexed ${videoId} comments=${comments.length} pgn=${Boolean(pgn)} url=${gameUrl ?? '-'}`);
  return comments;
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  ensureDataDirs();
  const manifest = loadManifest();
  const onStop = () => {
    persist(manifest);
    log('stopped, manifest saved');
    process.exit(130);
  };
  process.on('SIGINT', onStop);
  process.on('SIGTERM', onStop);

  log(`start index force=${options.force} data=${DATA_ROOT}`);

  const previous = readJson<SlowRunIndex>(POSITIONS_PATH);
  const kept = new Map<string, SlowRunComment[]>();
  if (previous && !options.force) {
    for (const comment of previous.comments) {
      const list = kept.get(comment.videoId) ?? [];
      list.push(comment);
      kept.set(comment.videoId, list);
    }
  }

  const targets = Object.values(manifest.videos).filter((video) => {
    if (video.status !== 'fetched') return false;
    if (options.videoId && video.videoId !== options.videoId) return false;
    if (options.playlist !== 'all' && video.speaker !== options.playlist) return false;
    return true;
  });

  let processed = 0;
  for (const video of targets) {
    if (options.limit != null && processed >= options.limit) break;
    if (!options.force && video.indexedAt && kept.has(video.videoId)) continue;
    const comments = await indexOne(manifest, video.videoId, options.force);
    if (comments === null) continue;
    if (comments.length > 0 || options.force || !kept.has(video.videoId)) {
      kept.set(video.videoId, comments);
    }
    processed += 1;
    await sleep(Math.min(options.delayMs, 800));
  }

  const comments = [...kept.values()].flat();
  const index: SlowRunIndex = {
    generatedAt: new Date().toISOString(),
    comments,
  };
  fs.writeFileSync(POSITIONS_PATH, `${JSON.stringify(index)}\n`);
  const withEpd = comments.filter((comment) => comment.epd).length;
  const pgns = Object.values(manifest.videos).filter((video) => video.hasPgn).length;
  log(`wrote ${POSITIONS_PATH} comments=${comments.length} withEpd=${withEpd} pgns=${pgns}`);

  const beats = [];
  for (const video of Object.values(manifest.videos)) {
    if (video.status !== 'fetched') continue;
    const record = readJson<{ speaker: SlowRunComment['speaker']; id: string; title: string }>(
      videoPath(video.videoId),
    );
    const cues = readJson<TranscriptCue[]>(transcriptPath(video.videoId));
    if (!record || !cues) continue;
    beats.push(
      ...extractTeachingBeats(cues, {
        speaker: record.speaker,
        videoId: record.id,
        title: record.title,
      }),
    );
  }
  fs.writeFileSync(
    TEACHING_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), beats }, null, 2)}\n`,
  );
  log(`wrote ${TEACHING_PATH} beats=${beats.length}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
