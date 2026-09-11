import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, '../..');
export const DATA_ROOT = path.join(REPO_ROOT, 'data', 'slow-runs');
export const VIDEOS_DIR = path.join(DATA_ROOT, 'videos');
export const TRANSCRIPTS_DIR = path.join(DATA_ROOT, 'transcripts');
export const GAMES_DIR = path.join(DATA_ROOT, 'games');
export const INDEX_DIR = path.join(DATA_ROOT, 'index');
export const MANIFEST_PATH = path.join(DATA_ROOT, 'manifest.json');
export const POSITIONS_PATH = path.join(INDEX_DIR, 'positions.json');
export const TEACHING_PATH = path.join(INDEX_DIR, 'teaching.json');
export const PYTHON_HELPER = path.join(here, 'transcript_py.py');
export const VENV_PYTHON = path.join(here, '.venv', 'bin', 'python');

export function ensureDataDirs(): void {
  for (const dir of [DATA_ROOT, VIDEOS_DIR, TRANSCRIPTS_DIR, GAMES_DIR, INDEX_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function videoPath(videoId: string): string {
  return path.join(VIDEOS_DIR, `${videoId}.json`);
}

export function transcriptPath(videoId: string): string {
  return path.join(TRANSCRIPTS_DIR, `${videoId}.json`);
}

export function gamePath(videoId: string): string {
  return path.join(GAMES_DIR, `${videoId}.pgn`);
}

export function appendLog(name: 'fetch' | 'index', line: string): string {
  const stamped = `${new Date().toISOString()} ${line}`;
  fs.appendFileSync(path.join(DATA_ROOT, `${name}.log`), `${stamped}\n`);
  return stamped;
}
