# Logged-in dashboard chrome and information architecture

After onboarding, Peakelo is a coaching studio, not a stats admin. This ADR locks the shell, the
route map, and the empty-state rules. Per-screen content lives in ADRs 0003–0007.

Research that shaped this (2026-09-09): Aimchess / Chess.com Insights / Lichess study patterns
(eval-bar dashboards rejected); New In Chess / ChessBase reading mode / ChessBase India writeups
(words over symbols); Letterboxd / The Athletic player pages (a person, not a KPI row); AoPS
curriculum maps and NIC workbooks (a path you can tick, not Duolingo); Feastables / neobrutalism
carpentry (offset ink, not candy kits). Peakelo tokens in `docs/design/ui.md` still win.

## Decision

Hybrid chrome: a sticky masthead plus a thin left rail. Five teaching destinations only.

| Item | Route |
| --- | --- |
| Home | `/home` (default after onboarding) |
| Profile | `/profile` |
| Games | `/games` |
| Roadmap | `/roadmap` |
| Drills | `/drills` |

Account (`/account`) and billing (`/billing`) sit under a **Settings** group at the bottom of
the rail — not in the masthead. Mobile uses a Settings tab that opens Account (Billing stays
linked from that page and from the desktop rail).
Game analysis is `/games/[id]`. A drill session is `/drills/[id]`. Chess.com link stays
`/connect/chesscom`.

Rail labels are visible from `lg` up, icons from `md`, a bottom tab bar below `768`. Active rail
item: magenta left rule, not a filled pill.

Masthead: Peakelo wordmark → `/home`, current destination in mono, display name, sign out.
Source switcher only on game surfaces. No persistent “Review last game” CTA, no rating, no
streak, no eval.

One loud plate (magenta or gold fill, or a 6px offset) per view. Analysis and writeups are quiet
paper. Empty states use the same plates as full ones — a blank scoresheet and a coach sentence,
never a grey illustration. Planned sections are listed on the page itself so the next pass knows
what to build.

No invented analysis. Player type, mistake names, arrows, drill FENs, and roadmap steps stay empty
until the engine pass exists. Real session data (name, linked platforms, imported games) may show.

## Rejected

- KPI home (accuracy, ACPL trophy, W/L pie, streak).
- Eval bar as the product.
- Fat 280px admin sidebar.
- Hiding Roadmap/Drills on the Analysis plan — those pages tell the truth and point at Training.
- Fake paywall before a processor exists.
- ALL-CAPS eyebrows (forbidden by `docs/design/ui.md`).
