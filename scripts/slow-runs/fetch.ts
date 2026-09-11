import fs from 'node:fs';

import { parseCli, selectedPlaylists, sleep } from './cli';
import { loadManifest, saveManifest, upsertVideo } from './manifest';
import {
  DATA_ROOT,
  TRANSCRIPTS_DIR,
  VIDEOS_DIR,
  appendLog,
  ensureDataDirs,
  transcriptPath,
  videoPath,
} from './paths';
import type { Manifest, PlaylistDef, Speaker } from './types';
import { fetchVideoBundle, listPlaylist } from './youtube';

function log(line: string): void {
  console.log(appendLog('fetch', line));
}

function persist(manifest: Manifest): void {
  try {
    saveManifest(manifest);
  } catch (error) {
    log(`failed to save manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function listOne(manifest: Manifest, playlist: PlaylistDef): Promise<void> {
  log(`listing ${playlist.speaker} ${playlist.id}`);
  const listed = await listPlaylist(playlist.id);
  log(`listed ${listed.length} videos for ${playlist.speaker}`);
  const existing = manifest.playlists.find((row) => row.id === playlist.id);
  const row = {
    id: playlist.id,
    speaker: playlist.speaker,
    title: playlist.title,
    url: playlist.url,
    listedAt: new Date().toISOString(),
    videoCount: listed.length,
  };
  if (existing) Object.assign(existing, row);
  else manifest.playlists.push(row);

  for (const video of listed) {
    if (manifest.videos[video.videoId]) {
      if (video.title && !manifest.videos[video.videoId]?.title) {
        manifest.videos[video.videoId]!.title = video.title;
      }
      continue;
    }
    upsertVideo(manifest, {
      videoId: video.videoId,
      speaker: playlist.speaker,
      playlistId: playlist.id,
      title: video.title,
      status: 'listed',
    });
  }
  persist(manifest);
}

async function fetchOne(manifest: Manifest, videoId: string, speaker: Speaker, force: boolean): Promise<void> {
  const row = manifest.videos[videoId];
  if (!force && row && (row.status === 'fetched' || row.status === 'no_captions')) {
    if (row.status === 'fetched' && fs.existsSync(transcriptPath(videoId)) && fs.existsSync(videoPath(videoId))) {
      return;
    }
  }

  log(`fetch ${speaker} ${videoId}${row?.title ? ` (${row.title})` : ''}`);
  try {
    const bundle = await fetchVideoBundle(videoId, speaker);
    fs.writeFileSync(videoPath(videoId), `${JSON.stringify(bundle.video, null, 2)}\n`);
    if (bundle.cues.length === 0) {
      upsertVideo(manifest, {
        videoId,
        speaker,
        playlistId: row?.playlistId ?? '',
        title: bundle.video.title,
        status: 'no_captions',
        fetchedAt: new Date().toISOString(),
        transcriptCues: 0,
        error: 'no captions',
      });
      log(`no captions ${videoId}`);
      persist(manifest);
      return;
    }
    fs.writeFileSync(transcriptPath(videoId), `${JSON.stringify(bundle.cues)}\n`);
    upsertVideo(manifest, {
      videoId,
      speaker,
      playlistId: row?.playlistId ?? '',
      title: bundle.video.title,
      status: 'fetched',
      fetchedAt: new Date().toISOString(),
      transcriptCues: bundle.cues.length,
    });
    delete manifest.videos[videoId]?.error;
    log(`saved ${videoId} (${bundle.cues.length} cues)`);
    persist(manifest);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    upsertVideo(manifest, {
      videoId,
      speaker,
      playlistId: row?.playlistId ?? '',
      title: row?.title,
      status: 'error',
      error: message,
    });
    log(`error ${videoId}: ${message}`);
    persist(manifest);
  }
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

  log(`start fetch limit=${options.limit ?? 'none'} playlist=${options.playlist} data=${DATA_ROOT}`);

  const playlists = selectedPlaylists(options.playlist);
  for (const playlist of playlists) {
    try {
      await listOne(manifest, playlist);
    } catch (error) {
      log(`list failed ${playlist.speaker}: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(options.delayMs);
  }

  const queued = Object.values(manifest.videos).filter((video) => {
    if (options.videoId && video.videoId !== options.videoId) return false;
    if (options.playlist !== 'all' && video.speaker !== options.playlist) return false;
    if (!forceReady(video.status, options.force)) return false;
    return true;
  });

  const perSpeaker = new Map<Speaker, number>();
  let attempted = 0;
  for (const video of queued) {
    if (options.limit != null) {
      const used = perSpeaker.get(video.speaker) ?? 0;
      if (used >= options.limit) continue;
      perSpeaker.set(video.speaker, used + 1);
    }
    attempted += 1;
    await fetchOne(manifest, video.videoId, video.speaker, options.force);
    await sleep(options.delayMs);
  }

  const fetched = Object.values(manifest.videos).filter((video) => video.status === 'fetched').length;
  const missing = Object.values(manifest.videos).filter((video) => video.status === 'no_captions').length;
  const errors = Object.values(manifest.videos).filter((video) => video.status === 'error').length;
  log(
    `done listed=${Object.keys(manifest.videos).length} attempted=${attempted} fetched=${fetched} no_captions=${missing} errors=${errors} videos=${VIDEOS_DIR} transcripts=${TRANSCRIPTS_DIR}`,
  );
}

function forceReady(status: string, force: boolean): boolean {
  if (force) return true;
  return status === 'listed' || status === 'error';
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
