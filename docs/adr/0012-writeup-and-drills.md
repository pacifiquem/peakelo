# Writeup, roadmap, and playable drills

The engine pass (ADR 0008) stays the source of evals, citations, and overlooked tags.
The **writeup** is the human coach document (ADR 0004 / sample-bare-analysis): one voice, every
claim tied to this player's games, tone from slow-run teaching beats and the course skill band
(ADR 0011). `now[]` is one roadmap action per named leak (mistakes / tactics / structures, and
clock when it is a leak) — not a cap of three. The **roadmap** and **drills** (ADR 0006) are
generated from that writeup — never from a generic puzzle bucket.

We generate the writeup with the same Mastra + Claude Opus 4.6 coach as lessons, reading the
bare snapshot JSON. Missing key or a failed model call is `SERVICE_UNAVAILABLE` — we do not
compile a costume document from string templates. If onboarding focus is `unknown`, the
server resolves the work from the snapshot (highest-leverage leak) before the coach writes.
Drill *positions* are materialized in code from stored citations (`fenBefore`, `bestUci` on
the analyzed ply). Reinforcement adds unused citations from that same writeup, never a fake
writeup. The model does not invent a FEN.

Play lives on `/drills/[id]`: the student moves, the server grades against the stored goal line
(and MultiPV only to accept an equally good alternative). Ask / explore reuse the lesson tools
scoped to that FEN. Progress is behavioral (`done-when` against recent games + hits), not XP.
Reinforcement runs after a new engine pass and after attempts: retire a leak that stopped
showing up, add new citations that still do.

**Considered:** shipping drills from the snapshot before a writeup. Rejected — ADR 0006: a
roadmap without a writeup is a generic tactics book.
