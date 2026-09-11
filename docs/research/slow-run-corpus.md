# Slow-run corpus

Public commentary playlists indexed by `scripts/slow-runs/`. Counts from a
TVHTML5 InnerTube browse on 2026-09-11.

| Speaker | Playlist | Videos | First video |
| --- | --- | --- | --- |
| `gotham` | `PLBRObSmbZluT5vjyir0xB_H1HPzwzgvvk` | 49 | `ItzuPvGO2Lw` |
| `hikaru` | `PL4KCWZ5Ti2H4hFLv7HBwVzYflOrUZ3qum` | 54 | `oDxyc6i0Jgo` |
| `naroditsky` | `PLT1F2nOxLHOc80pNT3XH1xUDyeom46R3X` | 81 | `J4WzTSR3hmo` |

**184** videos (the playlists are a bit smaller than the original ~240 estimate).

Listing: `yt-dlp --flat-playlist` when installed, else TVHTML5
`youtubei/v1/browse` with continuations. WEB playlist pages now use
`lockupViewModel` and their continuation tokens often return an empty body.

Captions: `yt-dlp --write-auto-sub`, then `youtube-transcript-api` in
`scripts/slow-runs/.venv`, then ANDROID InnerTube `player` + timedtext
`fmt=json3`. WEB caption URLs are pot-token gated.

PGN: only from a Chess.com / Lichess URL in the title, description, or first
~30s of transcript. Lichess `game/export/{id}`. Chess.com callback + Published
Data monthly archive. No invented games.
