import fs from 'node:fs';

import { MANIFEST_PATH, ensureDataDirs } from './paths';
import type { Manifest, ManifestVideo } from './types';

export function emptyManifest(): Manifest {
  return { version: 1, updatedAt: new Date().toISOString(), playlists: [], videos: {} };
}

export function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) return emptyManifest();
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
    if (!parsed || parsed.version !== 1 || !parsed.videos) return emptyManifest();
    return parsed;
  } catch {
    return emptyManifest();
  }
}

function mergeVideo(disk: ManifestVideo | undefined, memory: ManifestVideo): ManifestVideo {
  const merged: ManifestVideo = { ...disk, ...memory };
  for (const key of Object.keys(merged) as Array<keyof ManifestVideo>) {
    if (merged[key] === undefined && disk?.[key] !== undefined) {
      (merged as Record<string, unknown>)[key as string] = disk[key];
    }
  }
  return merged;
}

export function saveManifest(manifest: Manifest): void {
  ensureDataDirs();
  const disk = fs.existsSync(MANIFEST_PATH) ? loadManifest() : emptyManifest();
  const videos: Record<string, ManifestVideo> = { ...disk.videos };
  for (const [id, row] of Object.entries(manifest.videos)) {
    videos[id] = mergeVideo(disk.videos[id], row);
  }
  const playlists = manifest.playlists.length > 0 ? manifest.playlists : disk.playlists;
  const next: Manifest = {
    version: 1,
    updatedAt: new Date().toISOString(),
    playlists,
    videos,
  };
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);
}

export function upsertVideo(manifest: Manifest, row: ManifestVideo): void {
  const prev = manifest.videos[row.videoId];
  manifest.videos[row.videoId] = { ...prev, ...row };
}
