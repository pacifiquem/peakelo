# Peakelo visual system

Peakelo is a **learning product**. The chrome can be loud. The chess and the teaching cannot.

Read this file and the `align-ui` skill before any `client/` UI work. `frontend-design` applies for
taste; this file wins when they conflict.

## The mix

Three references, one hierarchy:

1. **Neo-brutalism (structure).** Thick ink borders, hard offset shadows, no soft gray cards, no
   24px radii. Surfaces sit on the page like printed matter. Buttons look pressable because they
   have a 4px offset, not because they glow.
2. **Vaporwave / Y2K (accent, not wallpaper).** Magenta and cyan as *signals*, gold as "advantage",
   a faint board grid in the page background, mono labels for evals and clocks. One CRT/scanline
   moment per view is enough. Never a full vaporwave collage.
3. **Instructional polish (the product).** Analysis text is Source Sans, high contrast, line length
   under 70 characters. Arrows, diagrams, and mistake lists must stay calmer than the marketing
   chrome. A student at 1700 must be able to read a writeup for ten minutes without the theme
   fighting them.

If deleting 30% of decoration improves the lesson, delete it.

## What this is not

- Inter + purple gradient + `rounded-2xl` + soft shadow (AI slop).
- Maximalist vaporwave: palm trees, statues, chrome text on every heading.
- Comic-book chaos that makes a blunder list look like a meme.
- Dark-mode-first. Default is warm paper. Dark can come later as a token set, not a rewrite.

## Tokens

Defined in `client/app/globals.css` (`@theme`). Use these names, do not invent hex in components.

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Paper | `--color-paper` | `#F4E8D0` | Page ground |
| Ink | `--color-ink` | `#12100E` | Borders, type, shadows |
| Sub text | `--color-text-sub-600` | `#3D3228` | Subtitles and secondary labels on paper |
| Magenta | `--color-magenta` / `primary-base` | `#E21B70` | Primary CTA, "your move" |
| Cyan | `--color-cyan` / `information-base` | `#00C2D1` | Opponent / info / links |
| Gold | `--color-gold` / `warning-base` | `#E8B923` | Advantage, streak, paid |
| Board | `--color-board` | `#2A1F14` | Dark squares, footer |
| Board light / dark | `--color-board-light` / `--color-board-dark` | `#EEEED2` / `#769656` | Lichess-green board squares |
| Last move | `--color-board-last` | green wash | Highlight the ply just played |

Shadows are **offsets**, not blurs: `3px 3px 0` / `4px 4px 0` / `6px 6px 0` in ink.

Radius: `2px` default, `4px` max. Chessboard squares are square. Pills are for badges only.

## Type

| Role | Face | Why |
| --- | --- | --- |
| Display | **Syne** (`--font-display`) | Geometric, slightly retro, not Inter |
| Body | **Source Sans 3** (`--font-body`) | Long analysis, high readability |
| Data | **IBM Plex Mono** (`--font-mono`) | Moves, clocks, ACPL, FEN |

Do not accent a single word in a headline with italic/color. Do not ALL-CAPS every eyebrow.
Display headings can be tight and heavy; body stays sentence case.

## Components

AlignUI is the library (copy-paste into `client/components/ui/`). After paste:

- Keep AlignUI anatomy (`Root` / `Trigger` / slots, `tv()`, `cn()`).
- Restyle variants to ink borders + offset shadows + Peakelo tokens.
- Remix Icon only. No Huge Icons, no lucide mix-ins.
- `w-fit` on buttons that are not full-width actions.

Never `window.alert` / `confirm` / `prompt`. Use AlignUI modal / toast / banner.

## Motion

One orchestrated entrance per page. Hover on interactive chrome only. Respect
`prefers-reduced-motion` (already in `globals.css`). Do not animate the board unless the user
asked for a move replay.

## Accessibility

- Contrast against paper must pass WCAG AA. Magenta-on-paper and cyan-on-paper are for large
  type or buttons with ink borders, not 12px captions.
- Teaching text sits on a solid paper/white well. Do not let the page grid run through
  letters. Folios, table headers, and subtitles use ink or `text-sub-600` (`#3D3228`), not
  the softer disabled gray.
- Magenta is the selected / primary accent (nav, filled filters, primary CTAs). Do not ship
  icon-only chrome; source switcher and account/billing need a visible word.
- Visible focus: ink ring, 2px, offset.
- Board and arrows need a non-color channel (labels, patterns) for color-blind players.

## Product surfaces

| Surface | Allowed loudness |
| --- | --- |
| Marketing / signup | Highest — poster, not dashboard |
| App chrome (nav, billing) | Medium — brutal frames, quiet type |
| Game review / analysis | Lowest — board and words win |
| Drills | Medium — arcade score energy, still readable |

GothamChess energy is in the **voice of the analysis**, not in neon behind the board.

## Adding official AlignUI CSS

`npx @alignui/cli tailwind` overwrites CSS. If you run it, do it in `client/`, then **re-apply**
the Peakelo `@theme` overrides from this file. Do not leave Inter as the only face.
