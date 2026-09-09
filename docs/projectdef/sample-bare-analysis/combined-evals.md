# Chess Improvement Roadmap — The Road to 2000

**Prepared from a full Stockfish (depth 13) engine analysis of your last 100 rapid games (10+0, 26 Aug – 5 Sep 2026), cross-checked against independent AI reviews and verified move-by-move against the actual PGN.**

---

## How to Use This Document

This isn't a rehash of general chess advice — every claim below is tied to a specific game from your own file, and I verified each one against the raw moves before including it (a handful of claims from the other AI reviews didn't hold up cleanly and were adjusted or dropped; everything that remains checked out exactly). Treat this as a living reference: revisit the cited games in an engine, confirm the pattern for yourself, and check items off as you drill them.

The document is organized in the order I'd tackle it: level-setting first, then the single highest-leverage fix (tactics), then openings, then endgames, then a full index of games by theme, then a weekly plan.

---

## 1. Level & Trajectory — Where You Actually Stand

Three estimates were floated across the reviews you collected: **~1100–1250** (Grok), **~1750–1850** (Gemini), and your own self-reported **~1700 rapid**. That's a huge spread, so it's worth resolving before anything else, because it changes how you should train.

My estimate, based on full-game engine analysis (every move of every game scored, not spot-checked examples): **Chess.com Rapid ~1600–1750.**

Why I trust this range over the low estimate: your average centipawn loss (ACPL) across all 100 games is **49.2**, essentially identical to your opponents' average of **49.5** — meaning matchmaking is working as intended and you're playing people at your actual level, not underperforming a easier pool. An ACPL in the high-40s is squarely intermediate/club territory, not beginner. More tellingly, the games contain real, non-trivial tactical execution — a rook sacrifice deflection (Game 19 vs. vincelin, 23.Rxe6!), a queen sacrifice you *suffered* from a genuine two-rook deflection combination (Game 55 vs. SgabelloPisello), forced mating nets you calculated correctly under pressure. Players below ~1200 essentially never produce or need to defend against combinations like these — the play is far too inconsistent. The low estimate looks like it was anchored on your blunders alone without weighing the quality of your best moments equally.

Why not as high as Gemini's 1850: your blunder rate (1.3 per game) and your White score (46%) are still clearly below what a stable 1800 sustains — an 1800 player blunders a piece for free far less than once every game on average.

**Bottom line: you're a genuine intermediate player with real tactical and attacking talent, capped right now by blunder frequency and a specific opening/technique gap rather than a lack of chess understanding.** 2000 is a realistic target — it's roughly a 300-400 point climb, which is a multi-month project of deliberate, focused practice, not a weekend fix. This document is that project's syllabus.

---

## 2. The Big Picture — How Your 100 Games Were Actually Decided

**Record: 52W – 39L – 9D (56.5% score)**

| Ending | Count | % of games |
|---|---|---|
| Resignation | 58 | 58% |
| Checkmate | 18 | 18% |
| Timeout (flag) | 9 | 9% |
| Opponent abandoned | 6 | 6% |
| Draw (repetition/agreement/insufficient material) | 9 | 9% |

**The single most important number in this whole analysis:**

| Blunders in the game | Games | Score |
|---|---|---|
| 0 blunders | 40 | **77.5%** |
| 1 blunder | 34 | 45.6% |
| 2+ blunders | 26 | **38.5%** |

That's not a small effect — it's the difference between a strong player and a struggling one, and it's entirely within your control. You averaged **1.30 blunders, 3.54 mistakes, and 4.59 inaccuracies per game.** Halving the blunder rate alone would plausibly be worth 100-150 rating points.

One more grounding fact: I checked, for every single loss, whether your opponent actually played more accurately than you that game. **In all 39 losses, they did — zero exceptions.** And in 48 of your 52 wins, *you* were the more accurate player. Your results track your own move quality almost perfectly. This is good news: you're not unlucky, you're not being cheated by the matchmaking, and the fixes below will show up directly in your score.

---

## 3. Tactical Sharpness — Your Highest-Leverage Fix

Given the blunder-to-score relationship above, this is where to start. Across your games (and confirmed independently by both AI reviews and my own engine pass), your tactical errors cluster into five recognizable, drillable patterns.

### Pattern A — Hanging pieces on unguarded squares

The simplest and most common failure: moving a piece to (or leaving it on) a square your opponent can just take, no combination required.

- **Game 26 vs. s_eRR_a** (loss): 13.Bh6?? walks the bishop straight into 13...Bxh6 — it was simply undefended. Eval swings from roughly equal to -6.8 pawns in one move.
- **Game 96 vs. BIGDADDYofMAGNUS** (loss): 16...exf3 wins a whole knight on f3 that had been left without support.
- **Game 3 vs. GogzyModus** (loss): 17.Qxe3?? Bd4! — the queen lands on a square attacked by a bishop that was already eyeing it.

**Drill:** Before every move — not just "critical" ones — ask "if I let go of the mouse right now, can anything of theirs take this piece for free?" Do 15-20 pure hanging-piece puzzles a day (Chess.com's "Hanging Piece" puzzle set, or Lichess puzzle themes filtered to "hangingPiece") for two weeks.

### Pattern B — The "danger squares": b3, c4, d4, e3, f3

This is the most specific, most corroborated pattern in the whole analysis — all three independent reviews flagged it, and every instance checked out exactly against the PGN. You have a recurring blind spot for pieces (usually enemy knights) already sitting on or jumping to these central/outpost squares near your queen or rook.

- **Game 90 vs. Ikirik1988** (loss): 23.Qe3 Nc4 24.Qd4?? Nxd4 — the queen walks onto a square directly attacked by the knight that had just landed on c4.
- **Game 31 vs. Mohdesouky** (loss): 16...Nb3! 17.Qc2 Nxa1 18.Rxa1 — a knight fork/infiltration through b3 wins the exchange outright.
- **Game 49 vs. parakcute** (loss): 27...Ne3! forks your queen and rook; 28.Qf7 Nxf1 29.Rxf1 costs you the exchange.

**Drill:** When scanning a position, specifically check squares b3/c4/d4/e3/f3 (and their mirror c6/f6/e6/d5/b6 as Black) for enemy knights or knight jumps before committing your queen or rook to that area of the board. This is a pattern-recognition habit, not a calculation one — it should become close to automatic with repetition. Lichess puzzle theme "fork" is the direct drill here.

### Pattern C — Trading off your fianchetto bishop for nothing

Specific to your White games: you repeatedly allow **...Bh3** or **...Bxg2**, trading your g2-bishop, after which the dark/light squares around your own king weaken permanently.

- **Game 31 vs. Mohdesouky**: 12...Bh3 13.Rfd1 Bxg2 14.Kxg2 — this happens *before* the knight fork above, and the weakened king is part of why the fork later works so well.

**Fix:** Once you commit to g3+Bg2, treat that bishop as precious. If Black threatens ...Bh3, consider Re1/Kh2 prophylaxis, or simply keep an escape square/defender ready rather than letting the trade happen automatically.

### Pattern D — Back-rank and king-safety collapses

Several losses end in textbook back-rank or king-hunt mates — worth recognizing as a family, not isolated incidents.

- **Game 53 vs. yomamaismymama6789** (loss): a literal 26.Rd8# back-rank mate after the back rank was left unguarded.
- **Game 51 vs. mgonzalezj** (loss): opponent rooks infiltrate the 7th rank twice (Ra7, then Rf7) before mating with Ra8#.
- **Game 84 vs. 1755Ata**, **Game 62 vs. RonaldRoaJacobs**, **Game 96 vs. BIGDADDYofMAGNUS**: all end in king hunts where checks accumulate because a luft square or defender was never created.

**Drill:** Once your last minor piece leaves the back rank, or once your king has only pawn cover left, spend one full move (or one full thought, at minimum) asking "do I need luft (h3/h6 or a rook lift) right now, before I do anything else?"

### Pattern E — Watch for it going *both* ways

Your wins show the exact same tactical sharpness working *for* you — this isn't just a weakness list, it's evidence you already have the raw pattern-recognition, it's just inconsistent:

- **Game 19 vs. vincelin** (win): 23.Rxe6! fxe6 24.Qxe6 — a clean rook sacrifice to rip open the king, finishing with 26.Qf7#.
- **Game 16 vs. gmccl001** (win) and **Game 68 vs. Adrireina** (win): both finished with sharp queen infiltrations (...Qf1#, ...Qf2#) that mirror the back-rank/king-safety losses above — you know how to *deliver* this kind of attack, you just aren't yet consistently defending against it.
- **Game 7 vs. PawlPatrol1**, **Game 23 vs. msrmnpm1** (both wins): clean forcing mating attacks once you got the initiative.

This matters for how you drill: you don't need to learn a new skill from scratch. You need to apply your existing attacking pattern-recognition defensively — ask "what would I do to me here?"

---

## 4. Opening Repertoire Plan

### As White — The English (1.c4)

You play 1.c4 in all 51 of your White games, and the results split sharply by how Black responds:

| Black's reply | Games | Your score | Verdict |
|---|---|---|---|
| 1...e5 (reversed Sicilian — your main line) | 20 | 48% | Even, but your biggest sample — worth the most attention |
| 1...Nf6 | 8 | 56% | Fine |
| 1...d5 | 3 | 100% | Strong (small sample, but keep the approach) |
| 1...g6 | 4 | 50% | Even |
| **1...e6** | **6** | **25%** | **Weak spot** |
| **1...c5** | **5** | **20%** | **Weak spot** |
| 1...d6 | 2 | 0% | Weak spot (very small sample) |

The pattern in the losses isn't opening theory — your blunders in these games happen well into the middlegame (moves 13-40), not in the first ten moves. **The real gap is that once Black declines to fight for the center, you don't have a plan.** In these games you tend to drift (Qb3-then-Qd1 shuffles, edge pawn pushes like a3/h3, aimless piece grabs) rather than execute a concrete idea.

**The fix that's already working in your own games:** against **1...e5 with an early ...Bc5**, playing an early **e3 + Nge2 + d4** to open the center scored well for you (Games vs. Second67, LucChamp23, bruild). That's your template — do the same thing structurally against the other passive/symmetrical replies:

- **vs. 1...c5**: commit to one plan and stop mixing them — either Nf3+d4 (a Maroczy-type center) or e4+d3+Nge2 (Botvinnik setup). Review **Game 31 vs. Mohdesouky** and note exactly where the plan-less shuffling started (around move 6-11, before the ...Bh3 and knight-fork tactics even happened).
- **vs. 1...e6 / French-like structures**: don't let Black complete a comfortable setup uncontested — review **Game 96 vs. BIGDADDYofMAGNUS** for how a slow buildup (Qd3, a3) let Black seize e4 and rip the position open.
- **General rule**: if you haven't played d4 (or a clear alternative central break) by move 10-12 against a passive Black setup, you're probably drifting.

**A second, simpler option worth genuinely considering:** you clearly like *systems* — a consistent, repeatable setup rather than deep theory. If tightening the English's middlegame plans still feels aimless after a couple weeks of focused work, switching to the **London System** (Bf4, e3, Nf3, c3, Nbd2/Bd3) gives you one setup that has a built-in plan against almost anything Black tries, at the cost of some independent piece activity. Your Black repertoire is already carrying your results (67% vs. 46%) — White only needs to stop bleeding points, not become your primary weapon.

### As Black — The Scandinavian (1...d5)

This is your strength, and it's remarkably disciplined: you played **1...d5 in all 42 of your Black games**, scoring **66% vs. 1.e4** (19W-10L) and **65% vs. 1.d4** (7W-3L-3D). Your main line, **1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5**, is a real home repertoire — keep it. The fixes here are narrow patches, not a rebuild:

**Patch 1 — The 2.e5 Advance Variation.** When White avoids the main line with 2.e5, you've dropped both games in this file (**Game 4 vs. StefiStanisavljevicT**, **Game 84 vs. 1755Ata**), both via kingside attacks after your position got squeezed. Prepare a specific setup here (typically ...c5, ...Nc6, and a timely ...Bf5 or ...Bg4 — but critically, don't let a piece get traded off into a weakened kingside the way Game 4 did with 8...Bxf3 9.Qxf3, which handed White the initiative for the Ng5/Bxg6/Nxe6 combination that followed).

**Patch 2 — Opposite-side castling and h4-h5 storms.** When White castles queenside and comes after your king with h4-h5, you've lost cleanly both times it happened (**Game 11 vs. Rx4Winners**, **Game 42 vs. Quibedo79**). In both games you responded passively on the flank (...g6, letting h5xg6 rip you open) rather than counter-punching in the center. Once you see O-O-O from White, treat it as a signal to accelerate your own central/queenside play immediately (...c5, ...Qc7, ...b5) rather than just defending where the pawns are pointing.

**Patch 3 — Early queen harassment (Nc3-e4/b5 hitting your queen on a5/d5).** Several losses (**Game 51 vs. mgonzalezj**, **Game 18 vs. Kakovf**) involve your queen getting knocked around early (...Qd8 retreats) and losing time, after which White's initiative snowballs. Consider getting the queen to a genuinely safe, useful square (a5 or d6/d8 with a clear plan) faster, rather than reacting move-to-move to each attack on it.

---

## 5. Endgame Curriculum

Here's a finding that didn't show up in either external review, because it required scoring every move: **your blunder rate is actually higher per move in the endgame (5.3%) than in the middlegame (3.8%)** — despite the endgame containing far fewer total moves per game. Your opening play, by contrast, is genuinely clean (0.3% blunder rate). This is the opposite of where most players' errors concentrate, and it's worth taking seriously.

### 5.1 — King safety once material thins out

Several of your checkmate losses share a specific, avoidable shape: **your own king walks forward into a string of checks** rather than retreating to safety, in positions that were already difficult.

- **Game 85 vs. lusalentinu**: five consecutive king moves (Ke4-Ke4-Kf4-Kg5-Kh6) march directly into a mating net.
- **Game 62 vs. RonaldRoaJacobs**: a similar decline — already down badly (-6.8 pawns), further king activity makes it worse rather than seeking the most stubborn defense, ending 50.Rh3#.
- **Game 83 vs. Micha-33**: same pattern, king exposed and hunted down in the endgame.

**Fix:** when your king is exposed and pieces are still coming off the board, stop and calculate forced sequences 2-3 moves deep *before* moving the king — don't move it reactively one square at a time. This is also a classic symptom of time pressure in long games, so pair this with conscious clock management in the final third of long endgames.

### 5.2 — Pawn-race counting (a precisely verified example)

This is the clearest single example I found of pure endgame technique costing you a full point. **Game 9 vs. 00noone0** (currently scored as a draw) was a completely won king-and-pawn race: at move 47, after 47...Kxb5, you were up nearly **+2.85 pawns** in a position where your kingside pawn was clearly going to promote first. Then **48.Kf6** — sending your king to escort/support the kingside pawn instead of first neutralizing Black's queenside pawns — let the position collapse to a dead-equal race, and it ended in perpetual check. The full winning advantage evaporated in that single move.

**This is a "counting" failure, not a calculation failure** — the specific skill is comparing *how many moves each side's fastest passed pawn needs to promote*, including checks and king detours, before committing your king to one side of the board. This is one of the most teachable, drillable endgame skills there is (search "pawn race" or "the rule of the square" in any endgame trainer).

### 5.3 — A second instructive draw: the slow bleed

**Game 12 vs. Pista49** shows a different failure mode from the same family: you were up **+5.08 pawns** at move 22, and rather than one big blunder, the advantage drained away through a long series of small, individually-reasonable-looking trades and moves (+5.1 → +2.2 → +1.5 → +1.0 → +0.5 → 0.0) until the position was a dead draw by repetition. Worth reviewing move-by-move to see which specific trades gave back the most — this is the "am I actually making progress or just shuffling" question that separates a technical win from a technical draw.

### 5.4 — A defensive win worth being proud of

Not every long endgame is a story of squandered wins — **Game 91 vs. VinzeRen** shows you defending accurately from a genuinely worse position (-2.95 pawns around move 27) all the way back to equality and a draw by repetition. That's real defensive technique. Keep this game as a reference for what good stubborn defense looks like when you *are* worse.

### 5.5 — Recommended endgame study list

Given the patterns above, prioritize in this order:

1. **King and pawn endgames**: opposition, the rule of the square, and specifically *pawn-race counting* (Game 9 is your own worked example — set up that exact position and verify the correct 48th move for yourself).
2. **Basic technique for converting a large material or positional edge without giving back tempo** (Game 12 is your worked example of what *not* to do).
3. **King safety in reduced-material positions** — recognizing when your king needs to actively flee toward its own pawns/pieces rather than advance, especially once the queens or rooks are still on the board and can generate checks (Games 62, 83, 85).
4. **Rook endgames generally** — a large share of your longest games (many 80-150+ move contests) are rook endgames, and this is the single most common endgame type at your level; basic technique here (cutting off the king, Lucena/Philidor positions) will pay off across many future games even beyond the ones in this file.

---

## 6. Full Game Index by Theme

A reference table for systematic review — work through a category at a time rather than randomly.

| # | Theme | Games (opponent, result) |
|---|---|---|
| Hanging pieces | Pattern A | 26 (s_eRR_a, L), 96 (BIGDADDYofMAGNUS, L), 3 (GogzyModus, L) |
| Danger-square forks | Pattern B | 90 (Ikirik1988, L), 31 (Mohdesouky, L), 49 (parakcute, L) |
| Fianchetto bishop given up | Pattern C | 31 (Mohdesouky, L) |
| Back-rank / king hunt losses | Pattern D | 53 (yomamaismymama6789, L), 51 (mgonzalezj, L), 84 (1755Ata, L), 62 (RonaldRoaJacobs, L), 96 (BIGDADDYofMAGNUS, L) |
| Sharp attacking wins (study your own strength) | Pattern E | 19 (vincelin, W), 16 (gmccl001, W), 68 (Adrireina, W), 7 (PawlPatrol1, W), 23 (msrmnpm1, W) |
| White vs. passive/symmetrical setups | Opening | 31 (Mohdesouky, L, vs c5), 96 (BIGDADDYofMAGNUS, L, vs e6) |
| Black vs. 2.e5 Advance | Opening | 4 (StefiStanisavljevicT, L), 84 (1755Ata, L) |
| Black vs. opposite castling + h-pawn storm | Opening | 11 (Rx4Winners, L), 42 (Quibedo79, L) |
| Black — early queen harassment | Opening | 51 (mgonzalezj, L), 18 (Kakovf, L) |
| Endgame — king safety collapse | Endgame | 85 (lusalentinu, L), 62 (RonaldRoaJacobs, L), 83 (Micha-33, L) |
| Endgame — squandered win via one move | Endgame | 9 (00noone0, D) |
| Endgame — squandered win via slow erosion | Endgame | 12 (Pista49, D) |
| Endgame — good defensive save | Endgame | 91 (VinzeRen, D) |
| Endurance wins (won on time, well-played) | Strength | 24 (manoybunso12, W), 33 (majidiran776, W), 86 (Carloscorrea12, W) |
| Long conversion wins | Strength | 99 (iamshaannnnnnn, W), 63 (fridon_jalilnasab, W), 94 (chessvic2121, W) |

---

## 7. Weekly Training Plan

Given you're already playing a high volume of games (100 in 11 days), the constraint isn't playing more — it's reviewing enough of what you already play. A rough weekly structure:

- **15-20 minutes/day, tactics puzzles**, rotating through the specific themes above: hanging pieces → knight forks (danger squares) → back-rank mates → deflection/removal-of-guard combinations. Don't do mixed puzzle rush yet — targeted theme training builds the specific pattern recognition faster.
- **1 loss reviewed per day**, using the question: "on which move did a piece become undefended, or did my king lose its cover?" Use the game index above rather than picking randomly.
- **1 endgame study session per week** (20-30 minutes), working through the recommended list in Section 5.5, using Games 9 and 12 as your own worked examples before moving to general material.
- **Play with intent**: since you're testing this in 5+0 games (faster than the 10+0 games analyzed here), expect your blunder rate to rise somewhat purely from the shorter clock — that's normal and not a sign you haven't learned the material. If it rises sharply, that's itself useful information: it means your blunder-check habit isn't fast enough yet to survive time pressure, which is worth knowing before you take it into longer time controls.
- **Once a week, a deliberate White-only session** where you force yourself to find a concrete central plan (d4 or e4) against a passive Black setup within the first 12 moves, rather than falling back into the shuffle pattern from Section 4.

---

## 8. Summary Checklist

- [ ] Drill hanging-piece puzzles daily (2 weeks minimum) — Pattern A
- [ ] Drill knight-fork/danger-square puzzles daily — Pattern B
- [ ] Build a luft/back-rank-safety habit once minor pieces thin out — Pattern D
- [ ] Fix the White plan vs. 1...c5 and 1...e6 (pick e3+Nge2+d4 or a Maroczy setup and commit)
- [ ] Prepare a specific line vs. 2.e5 in the Scandinavian
- [ ] Prepare a center-counterpunch response to opposite-side castling + h4-h5
- [ ] Study king-and-pawn race counting (Game 9 is your worked example)
- [ ] Study basic rook endgame technique (Lucena/Philidor, cutting off the king)
- [ ] Review one loss per day using the "where did a piece become undefended" question
- [ ] Reassess after ~4 weeks: is the White score moving off 46%? Is the blunder rate below 1.0/game?

Good luck — the underlying chess is genuinely there. This is a discipline project now, not a knowledge gap.