# Scoresheet glyphs follow Chess.com Classification V2

Move marks on `/games/[id]` use Chess.com’s published Classification V2 names and expected-points table (Best / Excellent / Good / Inaccuracy / Mistake / Blunder, plus Book, Brilliant, Great, Miss). Chess.com’s rating-dependent Expected Points formula is unpublished, so the only published curve we use is Lichess Win% (`0.00368208`). Winning / equal / losing bands for Great, Brilliant, and Miss are that 0.20 blunder swing around 0.50 — not homemade ±200 cp.

Lichess analysis (Inaccuracy / Mistake / Blunder only) and PGN NAGs were rejected for the scoresheet because the product already promised Chess.com V2 in ADR 0005 and the missing Great / Excellent / Book labels were the reported defect.

Stored `AnalyzedPly.judgment` stays the ADR 0008 raw-CPL buckets for the bare profile. Glyphs are computed by `annotatePly` and are a different field. Unifying those two is a later decision.

Audit: [`docs/research/engine-chess-standards.md`](../research/engine-chess-standards.md).
