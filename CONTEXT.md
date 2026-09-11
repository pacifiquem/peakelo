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

**Lesson**:
The instructive writeup for one ply (or a question about that ply): 2–3 sentences, clickable lines, arrows. Reads the engine pass. Does not replace it.
_Avoid_: writeup (as the stored product), annotation, chatbot, analysis (the pass already owns that word)

**Segment**:
One clickable span inside a lesson. May carry a `lineUci` the board can step through.
_Avoid_: citation, chip, highlight

**Variation**:
A line the player is exploring from the current ply, not the game's mainline.
_Avoid_: PV dump, engine line (that's the stored MultiPV), sidecar

**Slow run**:
A public master commentary series (GothamChess, Hikaru, Naroditsky) whose transcripts we index by position for the lesson tools.
_Avoid_: speedrun (wrong time control vibe), training set, dataset

**Slow-run comment**:
A timed quote from a slow run, attached to an EPD when we could recover the position.
_Avoid_: embedding, GM tip, coaching card

**Course skill range**:
Chess.com's published course bands (Under 400, 400–1200, 1200–1600, 1600–2000, Over 2000), applied to this game's platform rating without converting Chess.com ↔ Lichess.
_Avoid_: player type, class D, beginner (as a stored label)

**Game brief**:
The whole-game lesson written before ply lessons: what decided it, key plies, opening. Cached per game.
_Avoid_: summary, recap, accuracy report
