# Public one-game review on `/`

A logged-out visitor pastes a Chess.com or Lichess **game URL**. We fetch that public game, run
the same Stockfish pass as the desk, and write a coach review. No account. The point is a real
sample of the product, not a puzzle widget.

Lichess is `GET /game/export/{id}` (official). Chess.com PubAPI has no get-by-id; we resolve
White + year/month from the public game page, then load
`/pub/player/{user}/games/{YYYY}/{MM}` (the same archive the importer uses) and match the URL.
Only live bullet / blitz / rapid. Daily and variants are rejected.

The review is a spectator writeup of **this game** (both names, engine-backed key plies). Join
is the upsell. We do not invent FENs, evals, or a player type. Duplicate URLs reuse a finished
writeup. A `ready` row with no writeup (coach offline) or a `failed` engine row is requeued on
the next paste. The coach brief includes the PGN, scoresheet, and notable FENs; cited key plies
must match the stored pass. Work is a cron tick, not the request cycle.

Chess.com has no official get-by-id. We read White + end time from
`www.chess.com/callback/{live|daily}/game/{id}` (fixed host, numeric id), then the official
PubAPI monthly archive, trying the end month and its neighbors so a Date-header / UTC-month
mismatch still finds the game.
