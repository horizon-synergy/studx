# Contributing to StudX

This is a closed-source project — this guide is for internal
collaborators/agents, not a public open-source contribution flow. No
`LICENSE` file is included on purpose.

## Getting set up

```
npm install
cp .env.example .env
```

Fill in `.env`:
- `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` — from the
  Cloudinary dashboard (Media Library → Settings → Upload).
- `VITE_YOCO_ENABLED` — `true`/`false`, gates the Pro subscription checkout
  UI.
- `VITE_ADSENSE_*` — only set once the AdSense Sites status is "Ready";
  leave `VITE_ADSENSE_ENABLED=false` otherwise.
- `APP_URL` — the deployed frontend URL, used for payment redirect
  callbacks.

Cloud Functions secrets are separate from `.env` and are never stored in
the repo:
```
firebase functions:secrets:set YOCO_SECRET_KEY
firebase functions:secrets:set YOCO_WEBHOOK_SECRET
```

Then:
```
npm run dev              # frontend dev server
npm run functions:install
npm run functions:deploy # deploy functions only
npm run rules:deploy     # deploy firestore.rules only
```

## Branching / commits

- Branch names: `feature/<short-name>`, `fix/<short-name>`,
  `design/<short-name>` for redesign work.
- Commit messages: imperative mood, one line summary — `Add Paystack
  subaccount onboarding`, not `Added` / `Adding`.
- Keep the `functions/` folder out of any CI/CD pipeline connected to
  Netlify — it deploys separately via Firebase CLI, and its `.env` files
  should never leave your machine (see AGENTS.md → "Never touch").

## Code style

- Match the CSS Modules + design-token convention described in
  DOCUMENTATION.md and AGENTS.md — don't introduce a second styling
  approach.
- New UI: use the `.brut-*` utilities in `src/index.css` before writing
  new shadow/border/radius values. Check PLAN.md before restyling a page
  that's already been migrated, so you don't duplicate work.
- All data access goes through `src/services/firebase.js`.
- No test suite exists yet — at minimum run `npm run build` before
  opening a PR, and manually check both light and dark theme for UI
  changes.

## Reviewing a design-rollout PR

Since Phase 5 (design) touches CSS Modules across many files, when
reviewing:
1. Confirm no `--neu-*` variables or `.neu-*` classes were used in new
   code — that system is retired, see PLAN.md.
2. Confirm shadow direction is consistent with the rest of the app
   (`--brut-shadow-x/y`, currently down-right).
3. Spot-check dark mode.
4. Update PLAN.md's status checklist in the same PR.

## Questions

Ping Synergy directly — there's no public issue tracker for this repo.
