import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { PYTHON_HELPER, VENV_PYTHON } from './paths';
import { dedupeCues } from './quotes';
import type { ListedVideo, TranscriptCue, VideoRecord } from './types';

const execFileAsync = promisify(execFile);

const ANDROID_CLIENT = {
  clientName: 'ANDROID',
  clientVersion: '20.10.38',
  androidSdkVersion: 35,
  hl: 'en',
  gl: 'US',
};

const TV_CLIENT = {
  clientName: 'TVHTML5',
  clientVersion: '7.20260910.00.00',
  hl: 'en',
  gl: 'US',
};

const WEB_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20260910.01.00',
  hl: 'en',
  gl: 'US',
};

function which(bin: string): string | null {
  const dirs = (process.env.PATH ?? '').split(path.delimiter);
  for (const dir of dirs) {
    const candidate = path.join(dir, bin);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

async function innertube(endpoint: 'player' | 'browse', body: unknown): Promise<unknown> {
  const response = await fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`InnerTube ${endpoint} ${response.status}`);
  }
  return response.json();
}

function walkCollect(value: unknown, visit: (obj: Record<string, unknown>) => void): void {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) walkCollect(item, visit);
    return;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    visit(obj);
    for (const child of Object.values(obj)) walkCollect(child, visit);
  }
}

function titleFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as { simpleText?: string; content?: string; runs?: Array<{ text?: string }> };
  if (obj.simpleText) return obj.simpleText;
  if (obj.content) return obj.content;
  if (obj.runs?.length) return obj.runs.map((run) => run.text ?? '').join('');
  return undefined;
}

export async function listPlaylistYtDlp(playlistId: string): Promise<ListedVideo[] | null> {
  const bin = which('yt-dlp');
  if (!bin) return null;
  try {
    const { stdout } = await execFileAsync(
      bin,
      ['--flat-playlist', '-J', '--no-warnings', `https://www.youtube.com/playlist?list=${playlistId}`],
      { maxBuffer: 20 * 1024 * 1024, timeout: 180_000 },
    );
    const parsed = JSON.parse(stdout) as {
      entries?: Array<{ id?: string; title?: string; duration?: number }>;
    };
    const videos: ListedVideo[] = [];
    for (const entry of parsed.entries ?? []) {
      if (!entry.id) continue;
      videos.push({
        videoId: entry.id,
        title: entry.title,
        duration: typeof entry.duration === 'number' ? entry.duration : undefined,
      });
    }
    return videos.length > 0 ? videos : [];
  } catch {
    return null;
  }
}

export async function listPlaylistInnerTube(playlistId: string): Promise<ListedVideo[]> {
  const videos: ListedVideo[] = [];
  const seen = new Set<string>();
  let payload: unknown = await innertube('browse', {
    context: { client: TV_CLIENT },
    browseId: `VL${playlistId}`,
  });

  for (let page = 0; page < 40 && payload; page += 1) {
    const pageIds: ListedVideo[] = [];
    const continuations: string[] = [];
    walkCollect(payload, (obj) => {
      const videoId = obj.videoId;
      if (typeof videoId === 'string' && videoId.length === 11) {
        pageIds.push({ videoId, title: titleFromUnknown(obj.title) });
      }
      const contentId = obj.contentId;
      if (typeof contentId === 'string' && contentId.length === 11) {
        const meta = obj.metadata as { lockupMetadataViewModel?: { title?: unknown } } | undefined;
        pageIds.push({
          videoId: contentId,
          title: titleFromUnknown(meta?.lockupMetadataViewModel?.title),
        });
      }
      const next = obj.nextContinuationData as { continuation?: string } | undefined;
      if (next?.continuation) continuations.push(next.continuation);
      const command = obj.continuationCommand as { token?: string } | undefined;
      if (command?.token) continuations.push(command.token);
    });

    let added = 0;
    for (const video of pageIds) {
      if (seen.has(video.videoId)) continue;
      seen.add(video.videoId);
      videos.push(video);
      added += 1;
    }
    if (added === 0 || continuations.length === 0) break;
    payload = await innertube('browse', {
      context: { client: TV_CLIENT },
      continuation: continuations[0],
    });
  }
  return videos;
}

export async function listPlaylist(playlistId: string): Promise<ListedVideo[]> {
  const fromYt = await listPlaylistYtDlp(playlistId);
  if (fromYt && fromYt.length > 0) return fromYt;
  return listPlaylistInnerTube(playlistId);
}

type PlayerResponse = {
  playabilityStatus?: { status?: string; reason?: string };
  videoDetails?: {
    title?: string;
    shortDescription?: string;
    lengthSeconds?: string;
    videoId?: string;
  };
  microformat?: {
    playerMicroformatRenderer?: { publishDate?: string; description?: { simpleText?: string } };
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: Array<{ baseUrl?: string; languageCode?: string; kind?: string }>;
    };
  };
};

export async function fetchPlayer(videoId: string): Promise<PlayerResponse> {
  for (const client of [ANDROID_CLIENT, WEB_CLIENT]) {
    const json = (await innertube('player', {
      context: { client },
      videoId,
    })) as PlayerResponse;
    if (json.playabilityStatus?.status === 'OK' || json.videoDetails?.title) return json;
  }
  throw new Error(`No player response for ${videoId}`);
}

export function videoRecordFromPlayer(
  videoId: string,
  speaker: VideoRecord['speaker'],
  player: PlayerResponse,
): VideoRecord {
  const details = player.videoDetails ?? {};
  const micro = player.microformat?.playerMicroformatRenderer;
  return {
    id: videoId,
    speaker,
    title: details.title ?? videoId,
    description: details.shortDescription ?? micro?.description?.simpleText ?? '',
    duration: Number(details.lengthSeconds ?? 0) || 0,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    published: micro?.publishDate,
  };
}

function parseJson3(payload: unknown): TranscriptCue[] {
  const events = (payload as { events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }> })
    .events;
  if (!events) return [];
  const cues: TranscriptCue[] = [];
  for (const event of events) {
    const text = (event.segs ?? [])
      .map((seg) => seg.utf8 ?? '')
      .join('')
      .replace(/\n/g, ' ')
      .trim();
    if (!text) continue;
    cues.push({
      text,
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 0) / 1000,
    });
  }
  return cues;
}

function parseVtt(raw: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  const blocks = raw.replace(/^\uFEFF/, '').split(/\n\n+/);
  for (const block of blocks) {
    const match = block.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
    if (!match) continue;
    const start = parseVttStamp(match[1]!);
    const end = parseVttStamp(match[2]!);
    const text = block
      .split('\n')
      .filter((line) => !line.includes('-->') && !/^\d+$/.test(line) && line !== 'WEBVTT')
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    cues.push({ text, start, duration: Math.max(0, end - start) });
  }
  return cues;
}

function parseVttStamp(stamp: string): number {
  const [h, m, rest] = stamp.split(':');
  const [s, ms] = (rest ?? '0.0').split('.');
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms ?? 0) / 1000;
}

function parseSrvXml(raw: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  const re = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  for (const match of raw.matchAll(re)) {
    const text = decodeXml(match[3] ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    cues.push({
      text,
      start: Number(match[1]),
      duration: Number(match[2]),
    });
  }
  return cues;
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchCaptionTrack(baseUrl: string): Promise<TranscriptCue[]> {
  const stripped = baseUrl.replace(/&fmt=\w+/g, '');
  const jsonUrl = `${stripped}&fmt=json3`;
  const response = await fetch(jsonUrl);
  if (response.ok) {
    const text = await response.text();
    if (text.trim().startsWith('{')) {
      const cues = parseJson3(JSON.parse(text));
      if (cues.length > 0) return cues;
    }
    const xml = parseSrvXml(text);
    if (xml.length > 0) return xml;
  }
  const xmlRes = await fetch(stripped);
  if (xmlRes.ok) {
    const xml = parseSrvXml(await xmlRes.text());
    if (xml.length > 0) return xml;
  }
  return [];
}

export async function fetchTranscriptInnerTube(videoId: string, player?: PlayerResponse): Promise<TranscriptCue[]> {
  const resolved = player ?? (await fetchPlayer(videoId));
  const tracks = resolved.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const ranked = [...tracks].sort((a, b) => {
    const aEn = a.languageCode?.startsWith('en') ? 0 : 1;
    const bEn = b.languageCode?.startsWith('en') ? 0 : 1;
    if (aEn !== bEn) return aEn - bEn;
    const aManual = a.kind === 'asr' ? 1 : 0;
    const bManual = b.kind === 'asr' ? 1 : 0;
    return aManual - bManual;
  });
  for (const track of ranked) {
    if (!track.baseUrl) continue;
    const cues = await fetchCaptionTrack(track.baseUrl);
    if (cues.length > 0) return cues;
  }
  return [];
}

export async function fetchTranscriptPython(videoId: string): Promise<TranscriptCue[] | null> {
  const python = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : which('python3');
  if (!python || !fs.existsSync(PYTHON_HELPER)) return null;
  try {
    const { stdout } = await execFileAsync(python, [PYTHON_HELPER, videoId], {
      timeout: 60_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as { error?: string } | TranscriptCue[];
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return null;
  }
}

export async function fetchTranscriptYtDlp(videoId: string): Promise<TranscriptCue[] | null> {
  const bin = which('yt-dlp');
  if (!bin) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'peakelo-subs-'));
  try {
    await execFileAsync(
      bin,
      [
        '--skip-download',
        '--write-auto-sub',
        '--write-sub',
        '--sub-lang',
        'en.*',
        '--sub-format',
        'json3/vtt',
        '-o',
        path.join(tmp, '%(id)s'),
        '--no-warnings',
        `https://www.youtube.com/watch?v=${videoId}`,
      ],
      { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 },
    );
    const files = fs.readdirSync(tmp);
    const preferred =
      files.find((name) => name.endsWith('.json3')) ??
      files.find((name) => name.endsWith('.en.vtt')) ??
      files.find((name) => name.endsWith('.vtt')) ??
      files[0];
    if (!preferred) return [];
    const raw = fs.readFileSync(path.join(tmp, preferred), 'utf8');
    if (preferred.endsWith('.json3') || raw.trim().startsWith('{')) return parseJson3(JSON.parse(raw));
    return parseVtt(raw);
  } catch {
    return null;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export async function fetchTranscript(videoId: string, player?: PlayerResponse): Promise<TranscriptCue[]> {
  const yt = await fetchTranscriptYtDlp(videoId);
  if (yt && yt.length > 0) return dedupeCues(yt);
  const py = await fetchTranscriptPython(videoId);
  if (py && py.length > 0) return dedupeCues(py);
  return dedupeCues(await fetchTranscriptInnerTube(videoId, player));
}

export async function fetchVideoBundle(
  videoId: string,
  speaker: VideoRecord['speaker'],
): Promise<{ video: VideoRecord; cues: TranscriptCue[] }> {
  const player = await fetchPlayer(videoId);
  const video = videoRecordFromPlayer(videoId, speaker, player);
  const cues = await fetchTranscript(videoId, player);
  return { video, cues };
}
