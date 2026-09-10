# `/games` and `/games/[id]` — scoresheet and lesson

## `/games`

Paginated library of imported games. One chess platform at a time (ADR 0001). This list is real
today.

### On the desk now

- Source switcher in chrome.
- Time-control filter (bullet / blitz / rapid) against the existing query.
- Row: names, you-as-color, result, time control, played-at. Click → `/games/[id]`.
- Empty: “No games matched those time controls yet. Play one and wait for the next sync.”

### Later

Optional status only if true: Imported / Writeup ready / Writeup locked ($1.22) / Queued. Theme
index (hanging pieces, danger-square forks, …) as a filter once patterns exist. No accuracy
column, no Brilliant glyphs, no mixed Chess.com+Lichess list.

## `/games/[id]`

Teach this game in human language. Board is the diagram, not the product. Lowest visual loudness
in `docs/design/ui.md`.

### On the desk now

Real metadata and PGN from `GET /games/:id`. The board is official Lichess **Chessground**
(cburnett pieces, green squares). A move list lets the player walk the game: click a SAN, use
the arrows, or press ← → Home End. The board orients from the player’s color. No eval bar, no
invented arrows, no writeup.

### Later

- Quiet board + move list as navigation (shipped).
- Writeup: why they played it, what they overlooked, 2–3 engine lines as stories, arrows on the
  current ply.
- Clock callouts only when the clock decided the game.
- Footer: this pattern is [named mistake] → `/profile#mistakes`; Drill this → `/drills/[id]`.
- `?ply=` deep link from profile and drills.
- Analysis plan queued: “This game is in the pass.”
- No plan: “One game writeup is $1.22.” → `/billing?intent=game&gameId=`.

Never: eval bar, accuracy %, Brilliant/Great/Book, PV dump without sentences.
