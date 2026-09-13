# StudX Web v1.2

## Security (Phase 1) — done 2026-08-16
- [x] Lock role field on /users/{uid} — owner can no longer self-promote to admin
- [x] Server-side price verification for marketplace checkouts (Cloud Function recomputes from listings, ignores client total)
- [x] Server-side price verification for StudX Eats checkouts (recomputes from foodItems)
- [ ] Deploy updated firestore.rules + functions to prod, smoke test both checkout flows

## Payments migration (Phase 3, not started)
- [ ] Paystack integration for marketplace purchases (split payments to seller subaccounts)
- [ ] Seller onboarding flow — collect + verify Paystack subaccount/bank details
- [ ] Keep Yoco wired for StudX Pro subscriptions only
- [ ] Retire Yoco marketplace checkout path once Paystack is verified in prod

## Admin (Phase 2, not started)
- [ ] Analytics tab: GMV, order volume, active listings, user growth, top sellers, Eats revenue

## Ads (Phase 4, not started)
- [ ] Google AdSense integration alongside existing manual ads config
- [ ] Feed toggle: AdSense slot vs manual promoted ad, per AD_FREQUENCY

## StudX Eats
- [x] Student landing page
- [ ] Vendor dashboard
- [ ] Restaurant editing
- [ ] Menu management
- [ ] Place order
- [ ] Order tracking
- [x] Firestore permissions

## StudX Pro
- [ ] Analytics
- [ ] Badge
- [ ] Themes
- [ ] Featured listings

## Testing
- [ ] Student flow
- [ ] Vendor flow
- [ ] Payment flow (Yoco Pro subs)
- [ ] Payment flow (Paystack marketplace + split)

## Design (Phase 5 — COMPLETE, hybrid 70% neumorphism / 30% neobrutalism)
- [x] Hybrid token/utility system (`src/index.css`)
- [x] Every page and shared component — see PLAN.md for the full list and
      the rules for keeping new UI consistent with the system.