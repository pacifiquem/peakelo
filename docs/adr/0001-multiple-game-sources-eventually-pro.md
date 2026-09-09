# Multiple game sources are open now, Pro later

A player can link both Chess.com and Lichess and import games from each. The games list shows one source at a time. We are shipping that to everyone while Peakelo has no paid gate, so a player who uses both sites can build one profile. When payments exist, keeping more than one chess platform on the same player becomes a Pro feature; a single platform stays on the free/analysis path.

## Considered options

- **Gate dual-source now.** There is no checkout yet, so a gate would be a fake paywall.
- **Always mix both sources in one list.** The two sites are different identities and clocks; switching is clearer than interleaving.
- **Leave dual-source free forever.** Possible, but the extra ingest, sync, and later analysis cost is the obvious paid upsell.

## Consequences

Do not add a paywall in this slice. When Pro ships, enforce the cap in the link/import module — not by deleting the switcher — and keep existing dual-source players on a documented grandfather rule if we offer one.
