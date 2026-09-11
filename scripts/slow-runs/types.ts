export const SPEAKERS = ['gotham', 'hikaru', 'naroditsky'] as const;
export type Speaker = (typeof SPEAKERS)[number];

export type VideoFetchStatus = 'listed' | 'fetched' | 'no_captions' | 'error';

export type TranscriptCue = {
  text: string;
  start: number;
  duration: number;
};

export type VideoRecord = {
  id: string;
  speaker: Speaker;
  title: string;
  description: string;
  duration: number;
  url: string;
  published?: string;
};

export type ManifestPlaylist = {
  id: string;
  speaker: Speaker;
  title: string;
  url: string;
  listedAt: string;
  videoCount: number;
};

export type ManifestVideo = {
  videoId: string;
  speaker: Speaker;
  playlistId: string;
  title?: string;
  status: VideoFetchStatus;
  error?: string;
  fetchedAt?: string;
  transcriptCues?: number;
  hasPgn?: boolean;
  gameUrl?: string;
  indexedAt?: string;
  indexComments?: number;
};

export type Manifest = {
  version: 1;
  updatedAt: string;
  playlists: ManifestPlaylist[];
  videos: Record<string, ManifestVideo>;
};

export type SlowRunComment = {
  speaker: Speaker;
  videoId: string;
  title: string;
  tSec: number;
  quote: string;
  epd?: string;
  themes?: string[];
  confidence: 'high' | 'low';
};

export type SlowRunIndex = {
  generatedAt: string;
  comments: SlowRunComment[];
};

export type SlowRunSearchHit = SlowRunComment;

export type PlaylistDef = {
  id: string;
  speaker: Speaker;
  title: string;
  url: string;
};

export const PLAYLISTS: PlaylistDef[] = [
  {
    id: 'PLBRObSmbZluT5vjyir0xB_H1HPzwzgvvk',
    speaker: 'gotham',
    title: 'GothamChess CHESS SLOWRUN',
    url: 'https://www.youtube.com/playlist?list=PLBRObSmbZluT5vjyir0xB_H1HPzwzgvvk',
  },
  {
    id: 'PL4KCWZ5Ti2H4hFLv7HBwVzYflOrUZ3qum',
    speaker: 'hikaru',
    title: 'Hikaru slow run',
    url: 'https://www.youtube.com/playlist?list=PL4KCWZ5Ti2H4hFLv7HBwVzYflOrUZ3qum',
  },
  {
    id: 'PLT1F2nOxLHOc80pNT3XH1xUDyeom46R3X',
    speaker: 'naroditsky',
    title: 'Daniel Naroditsky slow run',
    url: 'https://www.youtube.com/playlist?list=PLT1F2nOxLHOc80pNT3XH1xUDyeom46R3X',
  },
];

export type GameUrlHit = {
  source: 'chesscom' | 'lichess';
  id: string;
  kind?: 'live' | 'daily';
  url: string;
};

export type ListedVideo = {
  videoId: string;
  title?: string;
  duration?: number;
};
