# Course skill range and whole-game brief

The coach reads this game's stored platform rating (Chess.com / Lichess Elo on the imported
game, else `WhiteElo` / `BlackElo` in the PGN). Teaching emphasis uses Chess.com's published
course skill ranges (Under 400 / 400–1200 / 1200–1600 / 1600–2000 / Over 2000). We do **not**
convert Lichess numbers into Chess.com numbers — the prompt names the source and time control.

A **game brief** is written first (`POST /games/:id/lesson/brief`, also on the first ply
lesson) from the engine-pass snapshot, then each ply lesson is written inside that story.
No invented evals. No rating on dashboard chrome (ADR 0002); the number may appear on the
lesson desk as teaching context.
