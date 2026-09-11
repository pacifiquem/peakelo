import { PLAYLISTS, SPEAKERS, type Speaker } from './types';

export type CliOptions = {
  limit?: number;
  playlist: Speaker | 'all';
  videoId?: string;
  force: boolean;
  delayMs: number;
};

export function parseCli(argv: string[]): CliOptions {
  const options: CliOptions = { playlist: 'all', force: false, delayMs: 1500 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    const next = argv[i + 1];
    if (arg === '--limit' && next) {
      options.limit = Number(next);
      i += 1;
    } else if (arg === '--playlist' && next) {
      if (next === 'all' || (SPEAKERS as readonly string[]).includes(next)) {
        options.playlist = next as Speaker | 'all';
      } else {
        throw new Error(`Unknown playlist ${next}`);
      }
      i += 1;
    } else if ((arg === '--video' || arg === '--video-id') && next) {
      options.videoId = next;
      i += 1;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--delay-ms' && next) {
      options.delayMs = Number(next);
      i += 1;
    }
  }
  return options;
}

export function selectedPlaylists(playlist: Speaker | 'all') {
  return playlist === 'all' ? PLAYLISTS : PLAYLISTS.filter((item) => item.speaker === playlist);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
