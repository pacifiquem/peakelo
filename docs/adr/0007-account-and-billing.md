# `/account` and `/billing`

Off the teaching loop. Entered from the **Settings** group at the bottom of the rail (Account
and Billing). Mobile Settings tab opens Account.

## `/account`

Inputs the coach uses. Not a second profile.

### On the desk now

Real session: display name, email, linked Google / Lichess / Chess.com. Add Chess.com →
`/connect/chesscom`. Training focus and note as stored from onboarding (read-only until an edit
route exists). Time controls listed. Sign out.

### Later

Edit focus, note, and which time controls to sync. Dual-source stays open until Pro ships
(ADR 0001). No theme playground, no board-piece shop, no env/setup copy.

## `/billing`

Three SKUs only, from `@peakelo/shared`: Analysis $14.99/mo, Training $34.99/mo, one game $1.22.

### On the desk now

Name the plans and what they unlock. Checkout plate: “Checkout is not wired. We will not pretend
a card was charged.” No fake “Active · renews …” status.

### Later

Current plan. Query `?intent=analysis|training|game&gameId=`. Manage payment and invoices. Stop
and ask before adding a processor. No fourth SKU, no dual-source product name, no credits wallet.
