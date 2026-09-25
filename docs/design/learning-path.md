# Learning path — how Peakelo shows practice and analysis

Agents changing `/home`, `/roadmap`, `/drills`, `/profile`, or a game lesson should follow this
file. It records what we took from Duolingo’s path and from a signed-in pass over Aimchess on
2026-09-25, and what we refuse to copy.

Duolingo sources live in [`docs/research/learning-path-duolingo.md`](../research/learning-path-duolingo.md).
Aimchess notes below are from the product itself (home, training room, a lesson, analysis board,
statistics, game history, a scouting report, explore, playground, feed, settings). Do not store
anyone’s Aimchess password in the repo.

## The rule

**A list is names and a count. The explanation is one screen later.**

If a page shows every why, every done-when, and every position stem at once, it is wrong. The
student should see where they are, what is next, and what is still ahead — then open one thing
to learn it.

## What to copy

### Path, not a catalog essay (Duolingo + Aimchess home)

- Duolingo’s home is one guided path of circles, grouped under a unit title. The circle does not
  carry the lesson text. Tapping it opens a short popup, then the lesson. They dropped the old
  branching tree because it made the next step ambiguous.
  Source: https://blog.duolingo.com/new-duolingo-home-screen-design/
- Aimchess **Daily plan** is the same idea in a list: date, one progress percent, then rows that
  are only a name and `0 / 3`. One **Start** begins today’s session. Weekly goals are the same
  shape (`Play 10 Rapid games`, `0 / 10`).
- Peakelo `/roadmap` and `/drills` use that shape. A row is the step or set name plus cleared /
  total. `why` and `doneWhen` open with the row (one open at a time) or live on the set page.
  They do not render on every row.

### One job when you open it (Aimchess lesson + Duolingo exercise)

- Aimchess Training Room is a grid of **names**. Locked sets show a lock, not a paragraph.
  Opening Blunder Preventer shows one sentence and **Start**. The puzzle itself is one position
  and a choice (`White to move` / two moves). No writeup beside the board.
- Duolingo lessons start in the exercise. New material is a handful of items, easier recognition
  before harder production.
  Source: https://blog.duolingo.com/duolingo-teaching-method/
- Peakelo: `/drills` names the sets. `/drills/blunder-preventer` names the moments (`Position 3 ·
  ply 24`). `/drills/[id]` is where the stem, the board, and the miss explanation live.

### Analysis is a map, then a chapter (Aimchess report)

- A report opens with one picture (radar of six skills) and one line per skill (`Tactics: 63%`),
  then a single button into lessons. Win rate, openings, and the rest are **later sections you
  scroll to**, each with a chart and a short interpretation — not six essays in the first card.
- Statistics cards are a name, a delta, **Details**, and **Practice**. The practice link is how
  a number becomes a drill.
- Peakelo `/profile` lists leak **names**. The story, citations, and “practice this” live on the
  chapter route (`/profile/mistakes`, …). `/home` names today’s drill. It does not paste the stem.

### Progress is a fraction, not a speech

- Aimchess: `0 / 6`, `Today’s progress 0%`, a streak count, `LEARNED` on an explore card.
- Peakelo keeps cleared / total from stored attempts. No XP, no crowns, no hearts.

## What not to copy

| Theirs | Why it stays out |
| --- | --- |
| Duolingo XP, gems, hearts, streaks, leagues, Super/Max upsell | Not our scoring model. ADR 0006 already rejects XP. |
| Duolingo owl, chests, and mascot motion | Chrome stays Peakelo (ink, magenta, cyan, gold). |
| Aimchess premium locks on statistics the user already earned | If we have the number, show it. Checkout stays the billing page. |
| Aimchess “34 more reports”, feed, scouting other players, play-the-AI ladder | Different product. We coach from the student’s own games. |
| A second essay under every path row “so the page feels full” | That is the bug this file exists to prevent. |

## Page contract

| Surface | Show at a glance | Show only after open |
| --- | --- | --- |
| `/home` | One next drill **name**, games waiting (names and result) | The position and the stem, on `/drills/[id]` |
| `/roadmap` | Gold rule in one line. Each step: name, now/later/done, `cleared/total` | `why`, `doneWhen`, Start — one step open |
| `/drills` | Set name and `cleared/total` | The set’s why, on `/drills/[kind]` |
| `/drills/[kind]` | Position number, ply, cleared or due | The stem and the board, on `/drills/[id]` |
| `/profile` | Headline plus leak names | The story, on `/profile/[section]` |
| `/games/[id]` | Board and the move list | The lesson for the ply the student asked to teach |

Do not put a chessboard grid behind type. The page ground is solid paper
(`docs/design/ui.md`). Accent color marks the current step and the primary button, not the
background of every paragraph.
