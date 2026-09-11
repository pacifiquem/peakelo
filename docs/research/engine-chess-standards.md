# Engine chess-term audit (AGENTS.md §2.19)

Primary-source audit of `@peakelo/engine` against Chess.com Help, Lichess source, and FIDE Laws. Written 2026-09-11. Do not treat Peakelo thresholds as official.

**Headline:** the engine ships two incompatible judgment systems, mixes Chess.com label names with a Lichess win% formula, and (until ADR 0009) omitted Great / Excellent / Book. Chess.com, Lichess, and FIDE disagree on several names.

**Decision (2026-09-11):** scoresheet glyphs follow Chess.com Classification V2 (ADR 0009). Expected points use the published Lichess Win% curve. Stored profile `judgment` stays ADR 0008 CPL cuts.

---

## Official move-classification families

### Chess.com Classification V2

Source: [How are moves classified?](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) (Help, updated Feb 2026). Overview list also in [How does Game Review work?](https://support.chess.com/article/653-computer-analysis-how-do-i-get-my-games-analyzed).

Expected Points is **rating + eval**. 1.00 always winning, 0.00 always losing, 0.50 even. The mapping formula is **not published**.

| Classification | Expected points lost |
| --- | --- |
| Best | 0.00 – 0.00 |
| Excellent | 0.00 – 0.02 |
| Good | 0.02 – 0.05 |
| Inaccuracy | 0.05 – 0.10 |
| Mistake | 0.10 – 0.20 |
| Blunder | 0.20 – 1.00 |

Specials (not from the table alone):

- **Great Move** — critical to the outcome: losing → equal, equal → winning, or the only good move. More generous for newer players.
- **Brilliant** — best or nearly best **and** a good piece sacrifice. Not in a bad position after. Not completely winning even without the move. More generous for newer players.
- **Miss** — fail to capitalize on the opponent’s mistake and miss a winning position. Winning / equal / losing cuts vary by rating.
- **Book** — a conventional opening move ([Game Review](https://support.chess.com/article/653-computer-analysis-how-do-i-get-my-games-analyzed); [2023 Game Review news](https://www.chess.com/news/view/chesscom-launches-game-review-v2)).

A 2022 Chess.com announcement also required a blunder to lose material or allow mate. The 2026 V2 table does **not** repeat that extra rule.

### Lichess computer analysis

Sources: [`Advice.scala`](https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala), [`winningChances.ts`](https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/winningChances.ts), [lichess.org/page/accuracy](https://lichess.org/page/accuracy).

Lichess emits **only** Inaccuracy / Mistake / Blunder (plus mate-sequence comments). No Brilliant, Great, Best, Excellent, Good, Book, or Miss.

Winning-chance drop (scale [−1, +1], from the published sigmoid):

| Judgment | Δ winning chances |
| --- | --- |
| Inaccuracy | ≥ 0.1 |
| Mistake | ≥ 0.2 |
| Blunder | ≥ 0.3 |

Win% for a cp score (clamp ±1000):

```
chances = 2 / (1 + exp(-0.00368208 * cp)) - 1
winPercent = 50 + 50 * chances
```

Coefficient from [lila#11148](https://github.com/lichess-org/lila/pull/11148). Client mate map: `(21 - min(10, |mate|)) * 100`, then the same sigmoid.

### FIDE / PGN

FIDE Laws do **not** define Game Review glyphs. PGN NAGs (`!` `?` `!!` `??` `?!` `!?`) are annotator symbols, not engine cutoffs.

---

## What Peakelo does today (after ADR 0009)

Two systems, same English words, different math. That split is now explicit.

| System | Code | Rule | Consumer |
| --- | --- | --- | --- |
| Stored `judgment` | `eval.ts` `judgmentFromCpl` | CPL ≤10 best, 11–49 good, 50–99 inaccuracy, 100–299 mistake, ≥300 blunder | `AnalyzedPly.judgment`, profile blunder counts, overlook gates |
| Displayed glyph | `annotate.ts` `annotatePly` | Chess.com V2 names + EPL table on Lichess Win%; Book / Brilliant / Great / Miss as specials | `/games/[id]` scoresheet |

`MOVE_ANNOTATIONS` is Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Miss, Mistake, Blunder.

Winning / equal / losing for specials is `0.50 ± 0.20` expected points (Chess.com’s published blunder swing), not ±200 cp. Brilliant “already winning” uses the second MultiPV line. Book uses the stored opening hit, not a client-side book replay. Sacrifice detection (piece given, less taken, landing square hanging) is still unpublished Chess.com internals.

`winPercent` copies the Lichess **cp** sigmoid. Mate uses homemade `10000 - 10*|n|`, not Lichess’s mate map. Chess.com Expected Points remains unpublished.

---

## Other engine terms

| Term | Official | Peakelo |
| --- | --- | --- |
| Opening names | Lichess [chess-openings](https://github.com/lichess-org/chess-openings): play **backwards** to a named EPD | Vendored book, last matching EPD along the game |
| Phase | Lichess [`Divider.scala`](https://github.com/lichess-org/scalachess/blob/master/core/src/main/scala/Divider.scala): middlegame when majors+minors ≤ 10 or back-rank sparse or mixedness > 150; endgame when majors+minors ≤ 6. Chess.com unpublished. FIDE silent. | Endgame if no queens or ≤ 6 non-pawn non-kings; else opening if `ply ≤ 20` |
| Time control | Chess.com: bullet < 3, blitz 3–10, rapid ≥ 10, estimate `base + 40×inc`. Lichess: bullet < 3, blitz 3–8, rapid 8–25, classical ≥ 25, same 40×inc. FIDE: blitz ≤ 10, rapid 10–60, standard ≥ 60, estimate `allotted + 60×inc`. No FIDE “bullet.” | Import trusts the platform’s own `time_class` / `speed`. Drops Lichess `classical`. Onboarding hint “Rapid 10–60” is FIDE, not Chess.com. |
| Results | FIDE / PGN `1-0` `0-1` `1/2-1/2` `*` | Matches |
| Eval bar | Lichess bar = Win%. Chess.com unpublished. | `1/(1+exp(-cp/280))` clamped 0.03–0.97 |
| Mate display | Lichess `#3`. Chess.com Help does not specify. | `M3` / `-M2` |
| Overlooked tags | None of hanging_piece / missed_hanging / missed_capture / missed_check / missed_mate / missed_combination / material_loss / time_scramble are Chess.com, Lichess analysis, or FIDE terms | Peakelo teaching taxonomy (ADR 0008) |
| Accuracy | Lichess published. Chess.com CAPS2 unpublished. | Not computed |

---

## Downstream contract

- `@peakelo/shared` `judgmentSchema` is the five CPL labels only. Glyphs live in `@peakelo/engine` `MoveAnnotation`.
- `GameAnalysis.plies` JSON stores stored `judgment`, not `annotatePly`. Changing CPL meaning rewrites history without a migration.
- Profile “blunders” count `judgment === 'blunder'`. Board “Blunder” is `annotatePly`. They can disagree.
- Adding Great / Excellent / Book touches `MOVE_ANNOTATIONS`, `client/lib/move-annotation.ts`, scoresheet icons, and tests.

---

## Safe vs needs a decision

**Safe (one cited source, already aligned or clearly a citation fix):**

- Keep FIDE/PGN results, SAN/UCI/FEN, `[%clk]`, simple `TimeControl`.
- Keep Lichess `chess-openings` names and say they are Lichess/ECO, not Chess.com Book.
- Cite Lichess for the `0.00368208` Win% coefficient if that model is kept.
- Cite Lichess for ACPL. Stop calling raw CPL cuts “Chess.com.”
- Collapse the two judgment paths so one ply cannot be `mistake` in JSON and `inaccuracy` on the board.

**Needs a product decision (sources disagree or the algorithm is unpublished):**

1. Classification family: Chess.com V2 names, Lichess three-judgment, PGN NAGs, or honest Peakelo CPL.
2. Time-control enum and whether Lichess `classical` is imported.
3. Phase: Lichess Divider vs keep Peakelo vs drop as an official term.
4. Eval bar and mate glyph.
5. Whether Brilliant / Great / Miss ship without Chess.com’s unpublished rating tables.
6. Whether Book uses the vendored Lichess book.
7. Reconcile ADR 0005 vs ADR 0008 in writing before more engine work.
