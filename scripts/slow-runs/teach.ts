import fs from 'node:fs';

import { extractTeachingBeats } from '../../server/src/modules/lesson/teaching';
import { loadManifest } from './manifest';
import { TEACHING_PATH, appendLog, ensureDataDirs, transcriptPath, videoPath } from './paths';
import type { TranscriptCue, VideoRecord } from './types';

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

ensureDataDirs();
const manifest = loadManifest();
const beats = [];
for (const video of Object.values(manifest.videos)) {
  if (video.status !== 'fetched') continue;
  const record = readJson<VideoRecord>(videoPath(video.videoId));
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
console.log(appendLog('index', `wrote ${TEACHING_PATH} beats=${beats.length}`));
