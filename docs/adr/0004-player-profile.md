# `/profile` — who this player is

The living coach document. Same job as `docs/projectdef/sample-bare-analysis/`: one voice, every
claim tied to this player’s games. One page with in-page anchors, not child routes.

## On the desk now

The **bare snapshot** from ADR 0008 once the engine pass is ready: openings, structures,
mistakes, tactics, and clock tables with citations. A persistent chrome line while the pass
runs. No guessed player type, no radar, no writeup voice.

## Later (after the writeup)

In this order, matching the sample writeups:

1. **Headline** (`#headline`) — player type in words (positional / tactical / gambiteer / mixed),
   time-control scoped.
2. **How games are decided** (`#deciders`) — mechanisms (hangs, time, conversion), not a results
   widget as the story. A record may appear inside a teaching sentence.
3. **Clock** (`#clock`) — time/move: flagger vs rusher vs dying in the last twenty seconds.
4. **Recurring mistakes** (`#mistakes`) — named patterns; each cites 2–5 of their games.
5. **Structures and lines** (`#structures`) — struggle by accuracy in the line, not win/loss.
6. **Tactics** (`#tactics`) — including 3–4 move combinations they miss and the ones they already
   see.
7. **Keep these** (`#keep`) — strengths the roadmap must not “fix.”
8. **Three things now** (`#now`) — each links to a roadmap step (Training) or to the cited games
   (Analysis).

Cited game names are links to `/games/[id]?ply=`. A profile with no links is a blog post.

## Empty copy

“No profile until every imported move has been through the engine. A type guessed from your first
moves would be a costume.”
