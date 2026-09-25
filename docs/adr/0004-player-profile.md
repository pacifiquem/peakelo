# `/profile` — who this player is

The living coach document. Same job as `docs/projectdef/sample-bare-analysis/`: one voice, every
claim tied to this player’s games. Students never see the bare engine snapshot (ACPL tables,
pawn-structure FEN fingerprints, opening win-rate ledgers). That JSON still feeds the writeup
(ADR 0008 / 0012). The UI is the writeup, in **real child routes**, one chapter per page.

| Route | Chapter |
| --- | --- |
| `/profile` | Diagnosis + every named bottleneck from the writeup + chapter list |
| `/profile/deciders` | How games are decided |
| `/profile/clock` | Clock |
| `/profile/mistakes` | Recurring mistakes (named patterns only) |
| `/profile/structures` | Structures and lines that leak |
| `/profile/tactics` | Named tactic groups you miss |
| `/profile/keep` | Keep these |
| `/profile/now` | What to do (roadmap actions — not a cap of three) |

`/profile/snapshot` redirects to `/profile`. Do not put engine counts in the rail or on the
student desk.

Landing is the product: the headline, one paragraph of *why*, then **every named bottleneck**
the coach found (mistakes, tactics, structures, clock) — not a top-three. Each leak links to
its chapter and to the matching drill set. `/profile/now` is the action plan; its length follows
the writeup, not a cap of three. Chapters stay one essay per URL.

**Considered:** in-page tabs / `?section=` on one URL. Rejected — it still presents the dump;
people scroll the same wall. Child routes are the organization.

Cited moments are links to `/games/[id]?ply=`. A profile with no links is a blog post.

## Empty copy

“No profile until every imported move has been through the engine. A type guessed from your first
moves would be a costume.”
