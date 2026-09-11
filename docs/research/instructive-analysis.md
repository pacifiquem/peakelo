# Instructive analysis (how a per-move lesson should talk)

Primary-source audit of educational game review against Chess.com Help / news, Lichess source and study docs, ChessBase / Chessify first-party UX, and published commentary from GothamChess, Naroditsky, Hikaru, and ChessBase India. Written 2026-09-11. Do not treat Peakelo copy as official chess vocabulary.

**Headline:** instructive analysis is a *story about one idea*, not a PV dump. Chess.com’s coach already does the commercial version (key moments, “Show Line”, Retry). Lichess computer analysis is a one-line template (`Inaccuracy. Ba2 was best.`). The human teachers Peakelo wants to feel like all do the same three beats: what you played, what you missed, what the plan was. Arrows and clickable SAN are only honest when they replay a stored engine line or a recovered slow-run position.

**Decision (2026-09-11, already in ADRs):** scoresheet glyphs stay Chess.com Classification V2 (ADR 0009). The lesson is a separate on-demand layer (ADR 0010) that may not invent evals or replace stored `judgment`. Expected points stay the published Lichess Win% curve. Profile `judgment` stays ADR 0008 CPL cuts. Gotham energy lives in the **words**, not in neon behind the board (`docs/design/ui.md`).

---

## Instructive vs an engine dump

An engine dump answers “what is the number and the PV.” Instructive review answers “what was the idea, why did the played move fail, and what should I try next time.” The sources agree on the split even when they disagree on labels.

Chess.com’s own pitch for Game Review is that computers are hard to understand, so the coach must say **why**: “telling you when a move perfectly capitalizes on forced checkmate, loses material, misses a chance to damage your opponent's pawn structure, and much more,” then **Show Line** plays the engine continuation on the board ([2022 Game Review news](https://www.chess.com/news/view/chesscom-releases-new-game-review); [2021 Game Review news](https://www.chess.com/news/view/new-game-review)). The Help page’s coach buttons are named after *ideas*, not evals: “Show Fork,” “Show Lost Piece,” “Show Checkmate,” “Show Idea,” plus “Best” ([How does Game Review work?](https://support.chess.com/en/articles/8584089-how-does-game-review-work), updated Aug 2026).

Lichess server analysis does **not** do that. [`Advice.scala`](https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala) emits only Inaccuracy / Mistake / Blunder (plus three mate-sequence strings) and appends the first move of the variation:

```
(eval → eval) Inaccuracy. Ba2 was best.
Checkmate is now unavoidable.
Lost forced checkmate sequence.
```

That is a useful glyph comment. It is not a lesson. Lichess puts the instructive layer in **Studies**: human comments, arrows, variations, and Interactive Lessons with hints and per-move error messages ([Lichess blog, 15 Apr 2018](https://lichess.org/@/lichess/blog/interactive-lessons/WtDErSQA)).

Levy Rozman states the job in the first minute of [How To Analyze Your Chess Games](https://www.youtube.com/watch?v=ylpAHvPlafc) (8 Jan 2021): take the game phase by phase — “where did you leave your opening knowledge,” how you navigated the middlegame, the endgame, and time — and “conceptualize into words moves that computers suggest.” In [The Truth About Game Review](https://www.youtube.com/watch?v=9Ov93YjTZ70) (21 Jun 2023) he warns that Coach’s one-liner is not enough: “when game review tells you you miss a chance to attack a bishop it's not telling you you're gonna get the bishop”; the real reason C5 was inaccurate was that “black needs to develop.”

ChessBase India’s staple is the opposite of a PV dump: a 10–15 minute post-mortem that asks *why this opening, what was prep vs calculated, what was missed* ([The India Forum, 2022](https://www.theindiaforum.in/forum/indian-chess-spring-and-sagar-shah-phenomenon)). Sagar Shah’s own DVD review notes that he does **not** skip to move twenty: he explains from move one so club players can follow the idea ([ChessBase, Learn from the Classics](https://en.chessbase.com/post/sagar-shah-learn-from-the-classics-1)).

**A ply is instructive when it has all four of these, in human language:**

1. **The played move, named.** SAN, not “White’s thirteenth.”
2. **The opponent’s idea or the threat.** What they can take, check, or force.
3. **One plan.** Not three equally-long PVs. Naroditsky: a plan is a short sequence toward a *final objective*, often just “castle,” not a “mythical 15 move idea” ([Speedrun Pt. 1](https://www.youtube.com/watch?v=Ytkf3qZTj74), 28 Oct 2020).
4. **Why the played move fails** — a concrete reply, not “−2.4.” ADR 0006 already requires this on a missed drill: “the idea in words + the refutation arrow, not −2.4.”

If any of those four is missing, the student is reading an engine dump with a personality overlay.

---

## How the named products actually review a game

### Chess.com Game Review (coach)

Sources: [How does Game Review work?](https://support.chess.com/en/articles/8584089-how-does-game-review-work); [Game Review terms](https://www.chess.com/terms/game-review); [2021](https://www.chess.com/news/view/new-game-review) / [2022](https://www.chess.com/news/view/chesscom-releases-new-game-review) news.

| Beat | What they do |
| --- | --- |
| Highlights | Eval graph + one-line Coach summary of the *game*, not every ply. Accuracy 0–100 (CAPS2; formula unpublished). |
| Key moves | Guided walk. “The first key move is usually the last book move.” Then brilliant / bad / missed tactic / etc. |
| Book | Name of the opening (click → Openings), times you have played it, score, suggested course, master continuations. Not a lecture on 1.Nf3. |
| Bad ply | Coach text + **Show** / **Show Line** (engine continuation) + named idea buttons (Fork, Lost Piece, Checkmate, Idea) + **Best** + **Retry**. |
| Retry | Student tries a move on *this* position. Wrong → coach feedback on the selected move. Right → “what your positional score would have been.” |
| Settings | Show Best Move on the board; review as White / Black / both; hide classification icons; autoplay Show Moves. |

Classification names are V2 (ADR 0009 / [`docs/research/engine-chess-standards.md`](./engine-chess-standards.md)). The Help table’s one-liners (“a weak move”, “a bad move that immediately worsens your position”) are **not** a substitute for the Expected Points table; they are UI copy. Chess.com, Lichess, and FIDE still disagree on the underlying math.

Self Analysis is the engine dump: eval bar, lines, suggestion arrows, move feedback. Game Review is the guided layer. Peakelo already split those the same way (ADR 0005 board tools vs ADR 0010 lesson).

### Lichess computer analysis and Studies

Sources: [`Advice.scala`](https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala); [lichess.org/page/accuracy](https://lichess.org/page/accuracy); [Interactive Lessons](https://lichess.org/@/lichess/blog/interactive-lessons/WtDErSQA).

- Server analysis: only I/M/B (winning-chance drops 0.1 / 0.2 / 0.3) plus mate-created / mate-lost strings. No Brilliant, Great, Best, Book, or Miss.
- Accuracy is a published Win% curve. Chess.com CAPS2 is unpublished. Lichess itself says the two sites will disagree ([accuracy page](https://lichess.org/page/accuracy)).
- Studies: comment on a *node*, draw arrows, add variations by playing them. Interactive Lesson: comment *before* the student’s move (default “What would you play in this position?”), optional hidden hint, per-wrong-move error comment on the side variation, optional comment on the automatic reply. Arrows sit on the board while the student thinks.

Lichess is the honest model for **scoped questions** (this node, this variation). It is not the model for Peakelo’s voice.

### ChessBase / Chessify (click a sentence, see the line)

ChessBase 18: the engine window shows “text comments with linguistic explanations”; a left click “transfer[s] the text comment including variant into the notation” ([Apply text analysis and variants with a click](https://help.chessbase.com/CBase/18/Eng/apply_text_analysis_and_varian.htm)). Graphic commentary is first-party: coloured arrows and squares “illustrate tactical points and make strategic themes and plans more clear” ([Graphic commentary](https://help.chessbase.com/CBase/17/Eng/graphic_commentary.htm)). Colours: green / yellow / red / dark blue / orange / magenta.

Chess.com Self Analysis: right-click a move → Comment or icon; play on the board to add a variation; right-click a side move to comment before/after, promote, or delete ([How can I add comments and variations to games?](https://support.chess.com/en/articles/8648793-how-can-i-add-comments-and-variations-to-games), Oct 2025).

Chessify: click a SAN in the notation to jump there; right-click → Add Comment; play a different move → new variation / overwrite / insert ([notation features](https://chessify.me/news/the-new-features-of-chessifys-notation); [2023 dashboard](https://chessify.me/news/latest-upgrades-on-analysis-dashboard) adds best-move arrows from the engine).

**None of these products make free prose clickable.** The clickable thing is always a *variation already in the tree* (or an engine line just transferred into the tree). Peakelo’s `segment.lineUci` is the same contract: the sentence is a caption for a stored line, not a hyperlink invented from English.

### Chessground brushes Peakelo already ships

[`@lichess-org/chessground` `draw.ts`](https://github.com/lichess-org/chessground/blob/master/src/draw.ts): core brushes `green` / `red` / `blue` / `yellow`. Defaults (DeepWiki dump of `state.ts`): green `#15781B`, red `#882020`, blue `#003088`, yellow `#e68f00`, plus paleGreen / paleBlue / paleRed.

Peakelo today (`client/lib/move-annotation.ts`, `game-editor.tsx`):

| Shape | Brush | Meaning |
| --- | --- | --- |
| Circle on the landing square | `paleRed` / `yellow` / `paleBlue` / `paleGreen` | V2 glyph family (blunder·mistake / inaccuracy·miss / brilliant·great / else) |
| Arrow | `green` | Stored engine best move, only when the pass is ready |

Lesson DTO (`packages/shared/src/lesson.ts`) already allows `green` `paleGreen` `blue` `paleBlue` `red` `paleRed` `yellow`. That is the Chessground set, not a homemade palette.

---

## Recommended Peakelo lesson template (2–3 sentences)

Product intent: “analyse a game but as a human… explain in human language with arrows how the line might go or end” ([`docs/projectdef/coreideaflow.md`](../projectdef/coreideaflow.md)). ADR 0005 later writeup: “why they played it, what they overlooked, 2–3 engine lines as stories.” ADR 0010: structured segments; a segment with `lineUci` is clickable.

Use this shape on a **key ply**. Do not emit three sentences on every Book / Best developing move.

**Sentence 1 — what you played (and what you thought it did).**  
Name the SAN. One clause on the idea you were following. If the idea is unknown, say the *failure mode* instead of inventing motive (“the bishop lands on an unguarded square,” not “you wanted to trade dark-square bishops”).

**Sentence 2 — the opponent’s idea / why it fails.**  
One concrete reply, in SAN, as a clickable segment. Prefer the opponent’s actual next move if it was the punishment; otherwise the engine’s first punishing move from stored MultiPV / `requestEngineLines`.

**Sentence 3 — the plan (one).**  
The better move as a human plan, then at most one short continuation. Naroditsky’s test: name the *final objective* (“castle short,” “take the hanging bishop,” “open the center while their bishop is on c5”), not a 12-ply PV.

Cap: `lessonSchema` already limits `segments` to 8 × 500 chars and `headline` to 160. Aim for **2–3 segments, ~40–70 words total**. `docs/design/ui.md` wants analysis line length under 70 characters; keep sentences short enough to sit next to the board.

### When to mention clocks

ADR 0005: “Clock callouts only when the clock decided the game.” The sample writeups follow that: time is a decider (7 wins / 2 losses on time in 10+0; “the last 20 moves are played on 10 seconds”), not a footnote on every ply ([`grok.md`](../projectdef/sample-bare-analysis/grok.md), [`claude.md`](../projectdef/sample-bare-analysis/claude.md)).

Mention the clock on a ply only if at least one is true in the stored analysis:

- the player flagged, or the opponent flagged;
- remaining time on this ply was a scramble (ADR 0008 already tracks blunders in a scramble and whether the opponent’s last three plies were fast);
- the better move is trivial and the spent time is the real story.

Otherwise stay quiet. Do not narrate “you had 4:12.”

### When to stay quiet on book moves

Chess.com’s first key move is “usually the last book move,” then the coach names the opening, your history in it, and master continuations — it does **not** lecture 1.c4 Nc3 g3 ([Help](https://support.chess.com/en/articles/8584089-how-does-game-review-work); [2022 news](https://www.chess.com/news/view/chesscom-releases-new-game-review)). Gotham, same video: “you need to not rely so heavily on the computer in the opening phase because the computer doesn't fully understand openings.” Lichess Book is not a classification at all.

Peakelo rule:

- **Inside Book (V2 glyph / stored opening hit):** at most one sentence on the *last* book ply — opening name from the vendored Lichess chess-openings book (already ADR 0008), plus “this is still theory.” No arrows unless a later key ply needs a recap.
- **First non-book ply:** that is the lesson. What plan begins now.
- Never invent a “Book” definition. Chess.com: “a conventional opening move.” Peakelo Book is the stored opening hit, not a client-side replay (engine-standards.md).

### Density by glyph (display glyph, not stored `judgment`)

| Display glyph (ADR 0009) | Lesson? |
| --- | --- |
| Book | Last book ply only. Opening name + stop. |
| Best / Excellent / Good | Skip unless it is a Great/Brilliant special, a conversion, or the student asked. |
| Brilliant / Great | Yes. What was sacrificed / what turned. Do not claim Chess.com’s unpublished rating generosity. |
| Inaccuracy | Yes if it changes the plan; otherwise one clause. |
| Miss / Mistake / Blunder | Always. Template above. |
| Opponent’s error you punished | Short: name the tactic you found. The sample writeups treat wins as evidence the pattern already exists. |

Stored `judgment` (CPL cuts) and the board glyph can disagree (ADR 0009). The lesson must not “correct” either number. It may *describe* the board event (“the bishop hangs”) without restating a homemade cutoff.

---

## Arrows and clickable segments without lying

**A shape is a claim.** Dummy arrows are banned (ADR 0005). Empty slow-run index is an empty search, not invented GM quotes (ADR 0010).

### What may become a `lineUci`

Only a sequence that already exists as:

1. the stored engine PV / MultiPV for this ply (ADR 0008 pass), or
2. a line returned by the lesson tool `requestEngineLines` (extra Stockfish MultiPV), or
3. a walk recovered from a slow-run hit whose EPD matches this position (ADR 0010: game links in video descriptions are the honest PGN source; spoken SAN is best-effort).

If the model cannot point at one of those three, the segment has **no** `lineUci`. The sentence can still name a single SAN that is on the scoresheet (the move that was played).

`lineSan` must be the legal SAN of `lineUci` from the lesson FEN. Max 16 UCI (schema). Prefer 2–6 plies — enough to show the tactic, not a tablebase sermon.

### Arrow grammar (Chessground brushes we already allow)

Align with ChessBase’s published meaning (green = good, red = bad, yellow = highlight, blue = other) and with Peakelo’s current board:

| Brush | Use on a lesson ply |
| --- | --- |
| `green` | The recommended move / the punishing take. Same as today’s best-move arrow. |
| `red` | The threat that refutes the played move (their capture, mate, fork). |
| `yellow` | A key square (unguarded landing square, luft, outpost). Not a move. |
| `blue` | A second legal idea only if it is in MultiPV or the slow-run hit. |
| `pale*` | Recap / quieter echo. Do not mix pale and saturated for the same claim. |

Rules:

- Every arrow’s `from`/`to` must be squares of a move in a supported line, or a square named in sentence 2 as hanging / checking. No “mood” arrows.
- At most 2–3 shapes on screen (schema max 8; the analysis surface is the quietest in `docs/design/ui.md`).
- Do not draw the engine-best green arrow *and* a lesson green arrow that disagree. If the lesson recommends MultiPV2 because it is the human plan, say so in words and use `blue` for the engine-best.
- Colour-blind: the clickable SAN is the non-colour channel (already required by `docs/design/ui.md`).

### Click a sentence, see the line

This is Chess.com **Show Line**, ChessBase “click the coloured comment,” and Lichess “click the SAN in the tree” — not a chatbot that highlights arbitrary words.

Peakelo already specified the DTO: `segments[].lineUci` + `lineSan`. The client steps the board into that variation (ADR 0010). Returning from the variation returns to the game ply. Do not promote the variation to the mainline.

---

## Questions (this position, not a chatbot)

Lichess Interactive Lessons scope every prompt, hint, and error message to **the current node**. Chess.com Retry is the same: “replay the position and try to find the best move”; wrong guesses get feedback on *that* move ([Help](https://support.chess.com/en/articles/8584089-how-does-game-review-work)).

Peakelo `lessonAskRequestSchema` already binds a question to `ply` + optional `variationUci` + short history (max 8). Keep it that tight.

Allow:

- “Why is Bh6 bad?” / “What if I play Rad1 instead?” / “Show the fork.”
- A question asked while standing in a clicked variation (pass that `variationUci`).

Refuse / redirect:

- Open-ended life-coach (“what kind of player am I?”, “give me a repertoire”). That is `/profile` after the writeup (ADR 0004), not this ply.
- Requests to change eval, glyph, or judgment.
- Questions that need a position the tools cannot load.

The answer is another `Lesson` DTO for the same FEN (or the variation FEN), not a new product voice.

---

## Voice: Gotham energy in the words

`docs/design/ui.md`: “GothamChess energy is in the **voice of the analysis**, not in neon behind the board.” Analysis is the quietest surface. Source Sans, high contrast, no comic-book blunder list.

Steal *structure* from the teachers. Do not impersonate a streamer (no subscriber-train, no “chat’s going wild,” no fake catchphrases).

### Patterns already in Peakelo’s sample writeups

These are the house style for *this* player. The per-move lesson should sound like a paragraph of these, not like a new mascot.

1. **Name the cheap failure, then the habit.**  
   “You played **13.Bh6**, moving your bishop to a square where it's simply undefended… The engine liked 13.Rad1… This is the cheapest kind of blunder to fix: a one-second ‘is this square covered?’ check before moving.” ([`claude.md`](../projectdef/sample-bare-analysis/claude.md) §1)

2. **You saw your idea; you did not see the reply.**  
   “Calculation depth is often 1 ply. You see your idea. You do not see their reply. `Qxe3` without looking at `Bd4`.” ([`grok.md`](../projectdef/sample-bare-analysis/grok.md) Weakness 4)

3. **A setup is not a plan.**  
   “`c4 + g3 + Bg2` is a starting formation, not a plan.” / “The real gap is that once Black declines to fight for the center, you don't have a plan.” ([`grok.md`](../projectdef/sample-bare-analysis/grok.md); [`combined-evals.md`](../projectdef/sample-bare-analysis/combined-evals.md) §4)

4. **Count, don’t vibe, when the endgame is the lesson.**  
   “This is a ‘counting’ failure, not a calculation failure.” ([`combined-evals.md`](../projectdef/sample-bare-analysis/combined-evals.md) §5.2)

### Patterns from the named commentators (public transcripts)

- **Gotham (Levy Rozman):** phase checkpoint → “what did I miss?” → “why?” → put the computer move into words. “go back and go what did i miss oh i should have played queen b6 why oh because i would have been attacking this and this” ([How To Analyze](https://www.youtube.com/watch?v=ylpAHvPlafc)). Practical vs engine: “Stockfish deceives your analytical thinking… practically speaking, if we sat down, 1800s in this position, I think white wins 75% of the time” ([This Chess Opening is FREE ELO](https://www.youtube.com/watch?v=fGXyAXcXkpg), 4 Sep 2026). Calculation: “In chess, we are not proving ourselves right. We are proving ourselves wrong.”
- **Naroditsky:** ask for the idea, then the obstacles. “what is the idea of a5”; “when i asked what a plan could be i'm asking about the final objective”; “plans can actually be pretty simple” ([Speedrun](https://www.youtube.com/watch?v=Ytkf3qZTj74); [another speedrun](https://www.youtube.com/watch?v=S-PGKHRQM5o)). On the opponent’s clock, talk ideas; on yours, calculate (quoted compilation of his speedrun advice, [Lichess blog by Dsoul20](https://lichess.org/@/Dsoul20/blog/danyas-general-advice--tips-quotes-from-gm-daniel-naroditskys-speedrun-videos/fmPtUgTj) — use only as a pointer; prefer a recovered slow-run hit for any on-site quote).
- **Hikaru (Slowkaru educational speedruns):** scan hanging pieces first, then development, then the tactic. “You always want to be aware of whether any of your pieces are hanging… is anything hanging?” ([Educational Speedrun 5](https://www.youtube.com/watch?v=EJCh5pXQJko)). “E4 of course is just a blunder here. It hangs a pawn.” ([London Slowkaru](https://www.youtube.com/watch?v=jFVj-D5iJm0)). When the engine move is unhuman: “Computer wants knight to E5. as a human very hard to play because it just hangs his pawn on d4.” ([Learn the Scandi](https://www.youtube.com/watch?v=hbfxYfKuVWo)).
- **ChessBase India / Sagar Shah:** start from move one; teach a *pattern* (pawn fork when two pieces sit one square apart) rather than a number ([Avoid this most common way to lose a piece](https://www.youtube.com/watch?v=oRLx0DGR4h0)). Post-mortem questions: why this opening, what was prep, what was calculated, what was missed.

Slow-run hits (`sources[]`) may quote those speakers only when the index returns a real EPD match. Never invent a Danya / Levy / Hikaru sentence.

---

## What we must not invent

Standing pick: AGENTS.md §2.19 and [`engine-chess-standards.md`](./engine-chess-standards.md).

| Temptation | Why not |
| --- | --- |
| Player types (“positional / tactical / gambiteer”) | ADR 0004 / 0008: not until a later writeup, and never guessed from a single ply. |
| Homemade glyphs or a fourth classification family | Scoresheet is Chess.com V2. Lichess is I/M/B only. FIDE Laws do not define Game Review glyphs; PGN NAGs are annotator symbols. |
| Chess.com Expected Points formula, CAPS2, rating-dependent Miss/Brilliant tables | Unpublished. Peakelo uses Lichess Win% and says so. |
| Peakelo `overlooked` tags as if they were Chess.com / Lichess / FIDE terms | engine-standards.md: hanging_piece / missed_combination / time_scramble are a Peakelo teaching taxonomy (ADR 0008). Fine as internal keys; do not print them as official names. |
| Accuracy % as the story | ADR 0005: never. Lichess and Chess.com already disagree on the number. |
| Invented eval, dummy arrows, fake GM quotes | ADR 0005 / 0010. |
| A new meaning for Book, Brilliant, Miss, time-control names, opening names | Look up Chess.com Help, Lichess chess-openings, or FIDE. If they disagree, say so; do not pick a homemade average. |
| Clock lectures on every ply | ADR 0005. |
| Neon / coach-avatar UI | `docs/design/ui.md`. Voice ≠ chrome. |

FIDE Laws are silent on instructive review. Do not cite FIDE for pedagogy.

---

## Prompt contract (lesson agent)

Short rules for the Mastra / Grok 4.6 loop. Not a 2000-word prompt.

**Inputs you may trust**

- The stored `GameAnalysis` ply (FEN, SAN, clocks, opening, MultiPV, display glyph, stored `judgment`).
- Extra lines from `requestEngineLines`.
- Slow-run hits from `searchSlowRuns` whose EPD matches. Empty index → no quote.

**Write**

- `headline` ≤ 160 chars: the habit, not the eval (“The bishop is hanging.”).
- 2–3 `segments`. Sentence 1 = played move + idea. Sentence 2 = opponent reply / why it fails (`lineUci` if supported). Sentence 3 = one plan + better move.
- `arrows` only from those lines or from a named hanging/checking square.
- `alternatives` ≤ 2, each a MultiPV move with a 1-line `why`.
- `sources` only real hits.

**Stay quiet**

- Book plies except the last book ply (opening name + stop).
- Best / Excellent / Good unless asked or special (Great / Brilliant / conversion).
- Clocks unless flag / scramble / time *is* the mistake.
- Accuracy, player type, unpublished Chess.com math, Peakelo tag names as if official.

**Never**

- Invent eval, PV, arrows, or quotes.
- Contradict stored `judgment` or the V2 glyph; do not try to unify them.
- Answer off-position questions; keep `lessonAsk` on this FEN / `variationUci`.
- Dump a PV without a sentence.
- Impersonate a streamer. Use the sample-writeup cadence (concrete SAN, one failure mode, one habit).

**If the tools cannot support the claim, drop the claim.** A shorter true lesson beats a vivid false one.

---

## Downstream contract

- DTO: `@peakelo/shared` `lessonSchema` / `lessonAskRequestSchema` (already). Do not add speculative fields.
- Engine pass remains the only source of evals and scoresheet glyphs (ADR 0008 / 0009 / 0010).
- Client: clickable `lineUci` steps the existing Chessground; lesson arrows replace, not stack on, a conflicting best-move green.
- Questions are a second authenticated call, same error envelope, no `/api/agents`.
- Voice is copy. UI stays the quiet analysis surface.

---

## Safe vs needs a decision

**Safe (one cited source, already aligned):**

- 2–3 sentence template above (Gotham / CBI / Chess.com Show Line / sample writeups).
- Clickable SAN only for stored or tool-fetched lines (ChessBase / Chess.com / Chessify).
- Quiet on Book except last book ply (Chess.com key-move Help).
- Clock only when it decided the ply (ADR 0005 + sample writeups).
- Arrow colours = Chessground / ChessBase green-good, red-threat, yellow-square, blue-alt.
- Questions scoped to this node (Lichess Interactive Lesson, Chess.com Retry).
- Do not ship accuracy as the story; Chess.com and Lichess already disagree.

**Needs a product decision (sources disagree or unpublished):**

1. Whether every imported ply gets a lesson or only key plies (Chess.com guided review is key-move-first; ADR 0005 later text sounds like a full writeup).
2. Whether “practical vs engine” language (Gotham’s 1800s-prefer-White example) is allowed when MultiPV says equal — that is a judgment, not a published metric.
3. Whether slow-run quotes appear in the student-facing lesson or only as `sources[]` citations.
4. Whether Retry (student plays a move on this ply) is in v1 or stays a later drill (ADR 0006).
5. Unifying stored `judgment` and V2 glyphs — still open (engine-standards.md).
