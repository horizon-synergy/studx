# PLAN.md — visual redesign rollout

## Current direction: hybrid system (~70% neumorphism / ~30% neobrutalism)

Supersedes two earlier explorations (pure neumorphism, then pure
neobrutalism — see CHANGELOG.md for that history). The hybrid is the
active system:

- **Neumorphism (base, ~70%)** — soft off-white surfaces, subtle raised/
  inset shadows, rounded cards. Used for: page backgrounds, listing cards,
  search/filter bars, form inputs, nav containers, profile/account
  sections, seller info cards, spec/detail panels.
- **Neobrutalism (emphasis, ~30%)** — flat fill, hard border, solid offset
  shadow. Reserved for: primary CTAs (Buy, Contact Seller, Sell
  Something/Create Listing, Submit), StudX Pro banners, featured/promoted
  listings, category chips, badges, empty states, confirmation/success
  messages.

Both share the same background, text, and radius tokens (`--neu-bg` /
`--brut-surface-alt` both resolve to the page background) so they read as
one coherent system, not two competing ones. Full token list in
DOCUMENTATION.md.

## Status

**Done**
- [x] Hybrid token/utility system (`src/index.css`) — spacing scale added,
      `--neu-bg` corrected to exactly match `--bg-page` (light + dark)
- [x] Admin dashboard shell — sidebar (desktop) / bottom nav (mobile)
- [x] Marketplace home (toolbar/search = neu, category chips = brut)
- [x] Listing card (card/image = neu, price tag/badges = brut)
- [x] Navbar
- [x] Listing detail (gallery/specs/seller = neu, price tag/actions = brut)
- [x] Checkout (cart panel = neu, Buy CTA/empty/success/error = brut)
- [x] Wishlist (empty state = brut)
- [x] Auth — Login/Register (card/inputs/Google btn = neu, Submit = brut)
- [x] Promoted listing banner — full brutalist (it's a promo banner, the
      one place the split leans further toward brutalism deliberately)
- [x] Ad banner (soft neu frame — not a marketplace action, kept subtle)
- [x] Dashboard — StudX Pro/verification banners = brut, listing rows = neu,
      action buttons = brut

- [x] AddListingTab (sections/inputs = neu, type toggle/submit/state msgs = brut)
- [x] PaymentSuccess, PaymentCancel — reuse Auth.module.css, already covered
- [x] Profile, Messages, ChatRoom (bubbles = neu, Send = brut)
- [x] Eats cluster — Eats.module.css covers Eats/VendorDetail/
      VendorDashboard (search=neu, cart/add/submit btns=brut, tags=brut
      chips); EatsCheckout + VendorSignup needed no extra work, they
      already reuse Checkout.module.css / Dashboard.module.css
- [x] Shared components — StudentBadge, StudentVerificationForm,
      OnboardingGuide, ViewerBanner (all inline-styled, no module.css;
      badges/CTAs went brutalist, form fields/modal card went neumorphic)
- [x] Admin internals — Admin.module.css, CouponsTab, PayoutsTab (also
      covers SellerPayoutSetup, which reuses it). Panels/rows/stat cards/
      inputs = neu; buttons, coupon code chips, success/error/empty
      states, and the payout "active" banner = brut

## Rollout complete

Every page and shared component in the app now uses the hybrid system.
Nothing left on the "not started" list. Future new UI should follow the
rules below rather than needing another dedicated pass.

## Rules for whoever continues this

- Default to `.neu-*`/neu tokens for anything a student browses, reads, or
  fills in. Reach for `.brut-*`/brut tokens only for the specific roles
  listed above — CTAs, Pro, featured/promoted, badges, chips, empty/
  success states. If you're not sure which, it's neumorphic — brutalism
  should stay the minority, not creep to parity.
- Keep `--neu-bg` and `--brut-surface-alt` equal to `--bg-page` — if you
  add a new theme or dark-mode variant, update all three together or the
  soft shadows will look like mismatched drop-shadows instead of a lifted
  surface.
- Keep brutalist shadow direction consistent (`--brut-shadow-x/y`,
  down-right) everywhere — mixing directions is the fastest way to make
  it look accidental rather than intentional.
- Don't let brutalist elements dominate a screen — if more than ~30% of
  what's visible has a hard border + offset shadow, that's a signal to
  soften something back to neumorphic, not to add more borders elsewhere
  to "balance" it.
