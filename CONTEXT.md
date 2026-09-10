# Peakelo

A chess coaching product: import a player's games, build a profile from engine-backed analysis, and teach in human language.

## Language

**Player**:
The person whose games Peakelo studies and who trains on the site.
_Avoid_: customer, account, client

**Chess platform**:
A site the player actually plays on — Chess.com or Lichess.
_Avoid_: provider (except as the OAuth vendor), site (too vague)

**Game source**:
Which chess platform a stored game came from.
_Avoid_: origin, site

**Pro**:
The paid plan that will later include training extras such as more than one chess platform on the same player.
_Avoid_: premium, plus, enterprise

**Engine pass**:
Background work that runs Stockfish on every imported ply and writes a bare snapshot.
_Avoid_: analysis job, scan, pipeline

**Bare profile**:
The raw engine snapshot for a player — counts, ACPL, openings, structures, overlooked tags, citations. Not a writeup.
_Avoid_: player type, report, essay, headline

**Ply analysis**:
One move of one game with evals, CPL, clocks, opening, and overlooked tags.
_Avoid_: annotation, comment

**Overlooked**:
What the board and the engine line say the player missed on that ply (hanging piece, combination, …).
_Avoid_: reason, why (as prose), motif guess from SAN text
