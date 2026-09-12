# StudX — Documentation

StudX is a student marketplace with three product surfaces sharing one
Firebase backend:

- **Marketplace** — peer-to-peer listings (products + services), wishlist,
  messaging, checkout.
- **StudX Eats** — campus food ordering: vendors, menus, orders.
- **StudX Pro** — paid tier for sellers (badge, custom themes, featured
  listings, analytics — see TODO.md for build status).

An **Admin** dashboard (`/admin`) covers moderation, orders, users, student
verification, analytics, ads, promoted listings, and platform settings.

## Stack

- React 18 + Vite, React Router v6
- Firebase: Firestore (data), Cloud Functions (server-side logic), Auth
- Tailwind v4 is a devDependency but the app is styled with **CSS Modules**
  per component (`src/styles/*.module.css`) plus a shared token layer in
  `src/index.css` — see "Design system" below.
- Recharts for admin analytics
- PWA via `vite-plugin-pwa`
- Deploy target: Netlify (frontend) + Firebase (functions/rules)

## Structure

```
src/
  pages/        one file per route (lazy-loaded in App.jsx)
  components/   shared UI: Navbar, ListingCard, route guards, admin shell...
  context/      React context: Auth, Cart, Theme, Notifications, Viewer
  services/     firebase.js — every Firestore/Functions call goes through here
  config/       listing categories, ad injection rules
  utils/        small helpers (e.g. Cloudinary thumbnail URLs)
  styles/       one *.module.css per component/page, plus index.css tokens
functions/       Cloud Functions (price verification, payments, admin ops)
firestore.rules  security rules — role field is locked, see below
```

## Key flows worth knowing before you touch them

**Checkout price integrity.** The client never gets to set the final price.
Both marketplace checkout and Eats checkout submit a cart; a Cloud Function
recomputes the total from the actual `listings`/`foodItems` documents and
ignores whatever total the client sent. Don't "optimize" this by trusting a
client-supplied total for anything money-related.

**Roles.** `role` on `/users/{uid}` cannot be self-set — it's locked
server-side (`firestore.rules` + functions) so a user can't promote
themselves to admin by editing their own doc. Any new admin-only feature
must check role server-side, not just hide a button client-side.

**Payments — two providers, deliberately.** Yoco currently handles both
marketplace checkout and Pro subscriptions. The in-progress migration (see
TODO.md, Phase 3) moves marketplace purchases to Paystack for seller
subaccount split payments, and retires Yoco down to Pro subscriptions only.
If you're touching checkout code, check which provider phase is currently
live before assuming either one.

**StudX Pro themes.** `[data-pro-theme]` on `<html>` overrides the base
light/dark tokens wholesale (each theme defines every variable itself,
rather than patching light/dark) — see the theme blocks in `index.css`.
Client-enforced only; the actual Pro entitlement check happens elsewhere.

## Design system

Active system: **hybrid — ~70% neumorphism / ~30% neobrutalism**.
Neumorphism (soft raised/inset shadows, rounded cards) is the base for
anything a student browses, reads, or fills in — listing cards, search/
filters, forms, nav, profile/account sections. Neobrutalism (flat fill,
hard border, solid offset shadow) is reserved for emphasis: primary CTAs
(Buy, Contact Seller, Sell Something/Create Listing, Submit), StudX Pro,
featured/promoted listings, badges, category chips, and empty/success
states. Tokens and utility classes live in `src/index.css`:

- Neumorphic tokens: `--neu-bg` (must equal `--bg-page` exactly, in every
  theme, or the soft-shadow illusion breaks), `--neu-light`, `--neu-dark`,
  `--neu-dist(-sm)`, `--neu-blur(-sm)`, `--neu-radius(-sm)`
- Neumorphic utilities: `.neu-raised`, `.neu-flat`, `.neu-pressed`,
  `.neu-inset`, `.neu-interactive`, `.neu-active`
- Neobrutalist tokens: `--brut-border`, `--brut-border-color`,
  `--brut-shadow-x/y`, `--brut-radius(-sm)`, `--brut-surface(-alt)`
- Neobrutalist utilities: `.brut-card`, `.brut-panel`,
  `.brut-btn(-primary|-accent)`, `.brut-input`, `.brut-interactive`
  (hover lifts, active slams flat), `.brut-active`
- Spacing scale: `--space-1` through `--space-8`

Two earlier single-style passes (pure neumorphism, then pure
neobrutalism) preceded this hybrid and are documented in CHANGELOG.md for
context — don't build new UI against either extreme.

New components: reach for the `.brut-*` utilities and CSS variables before
writing a new `box-shadow`/`border` value from scratch. If a value you need
isn't a token yet, add it as a token rather than hardcoding a hex/px.

## Local setup

```
npm install
cp .env.example .env   # fill in real values, see CONTRIBUTION.md
npm run dev
```

Cloud Functions secrets are set via Firebase CLI, not `.env` — see
`.env.example` for the exact commands.
