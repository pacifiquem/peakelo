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
in `docs/design/ui.md`. The board and the lesson stay on screen together: a two-pane study desk
(board + scoresheet sticky; lesson scrolling beside it). On small screens, Board / Lesson tabs
replace stacking the lesson under a 560px board. Breadcrumb is Games › this scoresheet.

### On the desk now

Real metadata and PGN from `GET /games/:id`. The board is official Lichess **Chessground**
(cburnett pieces, green squares). A move list lets the player walk the game: click a SAN, use
the arrows, or press ← → Home End. The board orients from the player’s color.

When this game’s `GameAnalysis` is **ready**, the desk also shows engine-backed (not invented)
tools: an eval bar + score, Remix icons on the scoresheet, and an optional arrow for the
engine’s next best move. Labels follow Chess.com Classification V2 (ADR 0009): the published
expected-points table (Best / Excellent / Good / Inaccuracy / Mistake / Blunder) plus Book,
Brilliant, Great, and Miss. Expected points use the published Lichess Win% curve. No analysis →
no bar, no icons, no arrow.

### Later

- Quiet board + move list as navigation (shipped).
- Engine bar / glyphs / best-move arrow from the pass (shipped when the pass is ready).
- Lesson: why they played it, what they overlooked, 2–3 engine lines as stories, clickable
  segments that walk a variation (ADR 0010).
- Clock callouts only when the clock decided the game.
- Footer: this pattern is [named mistake] → `/profile#mistakes`; Drill this → `/drills/[id]`.
- `?ply=` deep link from profile and drills (shipped).
- Analysis plan queued: “This game is in the pass.”
- No plan: “One game writeup is $1.22.” → `/billing?intent=game&gameId=`.

Never: invented eval, dummy arrows, accuracy % as the story, PV dump without sentences, a
writeup voice on this page.
