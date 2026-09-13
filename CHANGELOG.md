# Changelog

Format: date, then what changed and why. Newest first. Keep entries short —
this is a log, not release notes.

## Unreleased

- Design: hybrid system rollout **complete**. Final pieces: shared
  components (StudentBadge, StudentVerificationForm, OnboardingGuide,
  ViewerBanner — all inline-styled, edited directly since they have no
  module.css) and Admin internals (Admin.module.css, CouponsTab,
  PayoutsTab — the latter also covers SellerPayoutSetup by reuse). Every
  page in the app now uses the hybrid system; see PLAN.md for the full
  file list and the rules for keeping future UI consistent with it.
- Fix: Google sign-in reverted to `signInWithPopup` again — the
  `signInWithRedirect` + `handleGoogleRedirectResult()` wiring was correct
  this time, but redirect sign-in still wasn't completing in practice
  (bounces back to the login page). That symptom usually means the test
  domain isn't in Firebase Console → Auth → Settings → Authorized domains,
  or `firebaseConfig.authDomain` doesn't match — worth checking if
  redirect is revisited later. For now, popup is simpler to get working
  and doesn't depend on either of those being configured correctly.
  Account-doc creation logic moved back inline in `signInWithGoogle`,
  `handleGoogleRedirectResult` removed.
- Design: hybrid system rollout — Eats cluster done. Eats.module.css is
  shared by Eats (browse), VendorDetail, and VendorDashboard, so one file
  covered all three (search/menu items/vendor cards = neu, cart button/
  add-to-order/dietary tags/form submit = brut). EatsCheckout and
  VendorSignup needed no work — they already reuse Checkout.module.css /
  Dashboard.module.css from earlier rounds.
- Design: hybrid system rollout continued — AddListingTab (Create Listing
  form: sections/inputs neu, type-toggle/submit/state messages brut),
  Profile, Messages, ChatRoom (bubbles neu, Send button brut).
  PaymentSuccess/PaymentCancel needed no work — they already reuse
  Auth.module.css, which was covered in the previous round.
- Design: switched to a **hybrid system, ~70% neumorphism / ~30%
  neobrutalism** — soft raised/inset surfaces as the base (cards, forms,
  nav, filters), with flat hard-bordered offset-shadow treatment reserved
  for CTAs, StudX Pro, featured/promoted listings, badges, chips, and
  empty/success states. Replaces both earlier single-style explorations
  (pure neumorphism, then pure neobrutalism). Corrected `--neu-bg` to
  exactly match `--bg-page` in both themes (previously off by a few shades,
  which broke the soft-shadow illusion), added a spacing token scale.
  Applied across: index.css, AdminShell, Home, ListingCard, Navbar,
  ListingDetail, Checkout, Wishlist, Auth, PromotedListing, AdBanner,
  Dashboard. See PLAN.md for what's left.
- Fix: Google sign-in was silently failing to complete. `signInWithGoogle`
  correctly used `signInWithRedirect`, but the app never called
  `handleGoogleRedirectResult()` on load to resolve it, so the browser
  would come back from Google and nothing would finish signing the user
  in (and new accounts never got their Firestore user/profile docs
  created). Fixed by calling `handleGoogleRedirectResult()` once in
  `AuthContext`'s initial `useEffect`. `signInWithRedirect` itself was
  correct and is unchanged.

## Superseded design explorations (kept for context)

- Pure neumorphism pass — index.css tokens, AdminShell, Home, ListingCard.
  Retired: low contrast was a poor fit for a UI with a lot of state to
  communicate (badges, order status).
- Pure neobrutalism pass — same surfaces, plus Navbar. Retired in favor of
  the hybrid once the actual product brief called for softer base UI with
  brutalist accents only where emphasis is needed.
- Docs: added DOCUMENTATION.md, AGENTS.md, PLAN.md, CONTRIBUTION.md,
  `.env.example`, this file. Updated TODO.md with the design phase.

## 2026-08-16 — Security (Phase 1)

- Locked the `role` field on `/users/{uid}` — no client-side self-promotion
  to admin.
- Server-side price verification for marketplace and StudX Eats checkouts —
  Cloud Functions recompute totals from listings/food items, ignore the
  client-submitted total.
