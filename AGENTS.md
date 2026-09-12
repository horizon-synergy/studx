# AGENTS.md

Instructions for any AI agent (Claude Code, Copilot, Cursor, etc.) working
in this repository. Read this before making changes.

## Never touch

- `functions/.env.stud-x`, `.env`, `.env.yoco.local`, or any file matching
  `.env*` except `.env.example`. Never print their contents back to a user
  or log, and never commit them.
- `functions/node_modules/` — not source, don't read/edit/vendor from it.
- Don't weaken `firestore.rules`, especially the locked `role` field on
  `/users/{uid}` or the checkout price-verification functions. If a task
  seems to require trusting a client-supplied price or role, stop and flag
  it instead of implementing it.

## Project conventions

- **Styling**: CSS Modules (`ComponentName.module.css`) imported as `s` and
  used as `className={s.thing}`. Don't introduce styled-components,
  Tailwind utility classes in JSX, or inline `style={{}}` for anything
  beyond a one-off dynamic value. Tailwind is installed but unused as a
  class-authoring method in this codebase — CSS Modules + the token layer
  in `src/index.css` is the convention.
- **Design tokens**: use the `.neu-*`/`.brut-*` classes and `--neu-*`/
  `--brut-*`/existing `--bg-*`/`--text-*`/`--border-*` CSS variables in
  `src/index.css` rather than hardcoding colors, shadows, or radii. This
  is a hybrid system — ~70% neumorphism (base UI: cards, forms, nav,
  filters) and ~30% neobrutalism (emphasis: CTAs, StudX Pro, featured/
  promoted, badges, chips, empty/success states). Default to neumorphic;
  only reach for brutalist treatment on the specific roles above. See
  DOCUMENTATION.md → "Design system" and PLAN.md for which pages are
  migrated and the exact rules.
- **Data access**: all Firestore/Functions calls go through
  `src/services/firebase.js`. Don't call the Firebase SDK directly from a
  page/component.
- **Routes**: added in `src/App.jsx`, lazy-loaded (`lazy(() =>
  import("./pages/X"))`). Wrap authed routes in `<ProtectedRoute>`, admin
  routes in `<AdminRoute>`, vendor routes in `<VendorRoute>`.
- **Money**: never trust a client-computed total. If you're changing
  checkout logic, the authoritative recompute lives in `functions/`.

## Before committing / finishing a task

1. Update `TODO.md` if you completed, started, or invalidated an item on
   it — it's the single source of truth for build status, not this file.
2. Update `PLAN.md` if the task was part of the design rollout.
3. Don't add a `LICENSE` file or open-source boilerplate — this project is
   closed-source (see CONTRIBUTION.md).
4. If you added a new required environment variable, add it (name only,
   no value) to `.env.example` and note where to obtain it in
   CONTRIBUTION.md.

## Verifying changes

There's no test suite yet (see TODO.md). At minimum, run:

```
npm run build
```

and fix any build errors before handing work back. For UI changes, check
both `[data-theme="dark"]` and the default light theme — most components
support both via CSS variables, and a hardcoded color will only be
obviously wrong in one of them.
