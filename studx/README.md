# StudX

**Trade. Connect. Grow.** — a student marketplace web app for buying, selling, and trading with fellow students on campus.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Data Model (Firestore)](#data-model-firestore)
- [Firebase Configuration](#firebase-configuration)
- [Authentication & Roles](#authentication--roles)
- [Deployment (Netlify)](#deployment-netlify)
- [Git Workflow](#git-workflow)
- [Troubleshooting](#troubleshooting)

---

## Overview

StudX is a campus-focused marketplace. Students can:

- Browse and search **listings** (products & services)
- Message **sellers** in real time
- Place **orders** with a buyer → seller → admin lifecycle
- Create and redeem **coupons**
- Leave **reviews** and ask **questions** on listings
- Maintain **wishlists**, checkouts, and notifications

The app is a **client-side React application**: it talks directly to Firebase (Auth + Firestore) from the browser and uploads images to Cloudinary. There is **no custom server/backend** — all business logic runs in the browser, and access control is enforced by Firestore Security Rules.

---

## Features

| Area | Details |
|---|---|
| Auth | Email/password + Google sign-in via Firebase Auth |
| Listings | CRUD, images (Cloudinary), tags, featured flag, seller verified badge |
| Chat | One-to-one chat per listing, admin direct chat, 30-day TTL expiry (configurable), unread badges, real-time via `onSnapshot` |
| Orders | Lifecycle: `pending_seller → accepted → fulfilled → confirmed → completed`; also `declined`, `disputed`, `payment_released` |
| Coupons | Percent / flat discounts, active toggle, usage counting, server-side total math in-app |
| Reviews & Comments | Star ratings with denormalized `avgRating`/`reviewCount` on listings |
| Wishlist | Per-user `items[]` of listing IDs |
| Notifications | In-app inbox with unread counts + chime |
| Admin | User role/verification management, order status overrides, coupon & chat settings, platform overview |

---

## Tech Stack

- **Framework:** React 18 + Vite 5
- **Language:** JavaScript (JSX)
- **Styling:** Tailwind CSS 4 + CSS Modules (`*.module.css`)
- **Routing:** React Router v6 (lazy-loaded routes)
- **Backend-as-a-Service:** Firebase (Auth + Cloud Firestore)
- **Image uploads:** Cloudinary (unsigned upload preset)
- **Linting:** ESLint 9 (flat config) + eslint-plugin-react + react-hooks
- **Hosting/CI:** Netlify (continuous deployment from GitHub)

---

## Getting Started

### Prerequisites

- Node.js **18+** (built against v24)
- npm
- Firebase project credentials (see [Environment Variables](#environment-variables))
- (Optional) Firebase CLI for deploying rules/indexes

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env     # fill in your values (see below)

# 3. Start the dev server
npm run dev              # http://localhost:5173
```

### Production build

```bash
npm run build            # outputs to dist/
npm run preview          # serve the production build locally
```

### Lint

```bash
npm run lint             # ESLint, zero warnings allowed
```

---

## Environment Variables

All config is read from a local `.env` file at the **project root** and inlined by Vite at build time (prefix `VITE_`). Values must also be set in the **Netlify dashboard** for production builds.

```bash
# Firebase (create at https://console.firebase.google.com → Project settings → General)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=stud-x.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=stud-x
VITE_FIREBASE_STORAGE_BUCKET=stud-x.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Cloudinary (dashboard → Settings → Upload)
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

> ⚠️ **Security note:** `.env` is git-tracked in this repo. The Cloudinary **unsigned upload preset** allows anyone to upload — rotate it if this repo is public. For a hardened setup, remove `.env` from git and manage all values in the Netlify dashboard instead.

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint over `**/*.{js,jsx}` with `--max-warnings 0` |

---

## Project Structure

```
studx/
├── index.html                 # Vite entry HTML
├── vite.config.js
├── netlify.toml               # Netlify build + redirects + headers
├── firebase.json              # Firestore rules/indexes config (for Firebase CLI)
├── firestore.rules            # Security rules (deployed separately)
├── firestore.indexes.json     # Composite indexes (chats, notifications)
├── eslint.config.js           # ESLint 9 flat config
├── package.json
└── src/
    ├── main.jsx               # Entry — wraps app in providers
    ├── App.jsx                # Router + layout (Navbar/Footer)
    ├── index.css              # Global styles + design tokens
    ├── services/
    │   └── firebase.js        # ★ Single Firebase data-access layer (all queries/mutations)
    ├── utils/
    │   └── cloudinary.js      # Image upload helpers
    ├── context/               # React context providers
    │   ├── AuthContext.jsx
    │   ├── CartContext.jsx
    │   ├── NotificationContext.jsx
    │   └── ThemeContext.jsx
    ├── components/            # Shared UI
    │   ├── Navbar.jsx  Footer.jsx  ListingCard.jsx
    │   ├── CouponsTab.jsx  OnboardingGuide.jsx
    │   ├── ProtectedRoute.jsx  AdminRoute.jsx
    │   └── TestNotif.jsx
    ├── pages/                 # Route-level pages
    │   ├── Home  ListingDetail  Login  Register
    │   ├── Dashboard  Profile  Checkout  Wishlist
    │   ├── Messages  ChatRoom  Admin
    └── styles/                # CSS Modules (Chat, Navbar, Footer, Auth, …)
```

**Architecture convention:** every read/write goes through the functions exported by `src/services/firebase.js`. **Never import `firebase/app` or call Firestore directly in components** — keep the data-access layer isolated so queries, indexes, and rules stay consistent.

---

## Data Model (Firestore)

All data lives in Firestore (project `stud-x`). Fields are written exactly as shown.

### `users/{uid}` — accounts & roles
| Field | Type | Notes |
|---|---|---|
| `uid` | string | Auth UID |
| `email` | string | |
| `role` | string | `'user'` or `'admin'` |
| `verified` | bool | Seller verification (admin-set) |

### `profiles/{uid}` — public display profile
| Field | Type | Notes |
|---|---|---|
| `uid` | string | |
| `displayName` | string | |
| `avatarUrl` | string | |

### `listings/{id}`
| Field | Type | Notes |
|---|---|---|
| `sellerId` | string | Owner UID |
| `title` | string | |
| `price` | number | |
| `type` | string | `'product'` / `'service'` |
| `images` | string[] | Cloudinary URLs |
| `imageUrl` | string | Cover image |
| `tags` | string[] | |
| `featured` | bool | Admin flag |
| `createdAt` | timestamp | |
| `avgRating` | number | Denormalized (see reviews) |
| `reviewCount` | number | Denormalized |

### `orders/{id}` — lifecycle
`status`: `pending_seller → accepted → fulfilled → confirmed → completed` (+ `declined`, `disputed`, `payment_released`).

| Field | Type | Notes |
|---|---|---|
| `buyerId` / `sellerId` | string | |
| `listingId` / `listingTitle` / `listingPrice` / `listingImageUrl` | | Snapshot at order time |
| `status` | string | See lifecycle |
| `sellerAccepted` / `sellerConfirmed` / `buyerConfirmed` / `paymentReleased` | bool | |
| `disputedBy` | string | Optional |
| `statusHistory` | array | `{status, timestamp, by}` |
| `note` | string | Optional buyer note |
| `createdAt` | timestamp | |

### `notifications/{id}`
| Field | Type | Notes |
|---|---|---|
| `uid` | string | Recipient |
| `type` | string | `new_order`, `order_accepted`, `new_message`, … |
| `title` / `body` | string | |
| `orderId?` / `chatId?` | string | Deep links |
| `read` | bool | |
| `createdAt` | timestamp | |

### `coupons/{id}`
`sellerId`, `code` (uppercased), `type` (`percent`/`fixed`), `discount`, `usageCount`, `active`, `createdAt`.

### `reviews/{id}` & `comments/{id}`
`listingId`, `authorId`, `rating` (reviews only), `body`, `createdAt`. Writing a review recomputes `avgRating`/`reviewCount` on the listing.

### `wishlists/{uid}`
`{ items: string[] }` — array of listing IDs.

### `checkouts/{id}`
`buyerId`, `items[]` (listing snapshot), `subtotal`, `discount`, `total`, `couponCode?`, `status`, `createdAt`.

### `chats/{chatId}` (+ `chats/{chatId}/messages/{id}`)
| Field | Type | Notes |
|---|---|---|
| `participants` | string[] | `[buyerId, sellerId]`; admin chats prefixed `admin_` |
| `listingId?` / `listingTitle` | | Chat topic |
| `isAdminChat` | bool | |
| `expiresAt` | timestamp | TTL (default 30 days) |
| `lastMessage` / `lastMessageAt` / `lastSenderId` | | Preview + unread logic |

Messages subcollection: `{ senderId, text, createdAt }`.

### `settings/chat`
`{ ttlDays: number }` — default chat TTL. Managed by admins.

---

## Firebase Configuration

This repo versions the Firestore backend configuration so changes are reviewable.

### Composite indexes (`firestore.indexes.json`)

Two query patterns **require composite indexes**. Without them Firestore rejects the query and the UI silently fails (see [Troubleshooting](#troubleshooting)):

| Collection | Query | Index |
|---|---|---|
| `chats` | `array-contains participants` + `orderBy lastMessageAt desc` | `participants` (CONTAINS) + `lastMessageAt` (DESC) |
| `notifications` | `where uid` + `orderBy createdAt desc` | `uid` (ASC) + `createdAt` (DESC) |
| `notifications` | `where uid` + `where read` + `orderBy createdAt desc` | `uid` (ASC) + `read` (ASC) + `createdAt` (DESC) |

### Deploy

```bash
# 1. Install the Firebase CLI and log in
npm install -g firebase-tools
firebase login
firebase use stud-x

# 2. Create/update composite indexes (fixes Messages + unread badges)
firebase deploy --only firestore:indexes

# 3. Apply security rules (review firestore.rules first — this locks down the DB)
firebase deploy --only firestore:rules
```

> Deploying **indexes is non-destructive** and only adds capability. Deploying **rules changes access behavior** — do it in a staging project first.

---

## Authentication & Roles

- Firebase Auth manages identity; user metadata lives in `users/{uid}`.
- **Role model:** `users/{uid}.role === 'admin'` gates `/admin` (`AdminRoute`). Sellers are flagged via `users/{uid}.verified`.
- `ProtectedRoute` gates all pages requiring a session.
- The security rules rely on `users/{uid}` for admin checks — keep that collection write-protected (owner/admin only).

---

## Deployment (Netlify)

- Repo: `github.com/horizon-synergy/studx`
- **Base directory:** `studx/` (the app root inside the repo)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Continuous deployment:** pushes to `main` trigger a production deploy. Branch/PR pushes create **deploy previews**.

Environment variables must be mirrored in **Netlify → Site configuration → Environment variables** (same `VITE_*` names as `.env`). The `netlify.toml` also sets SPA redirects and security headers.

---

## Git Workflow

1. Create a branch off `main`: `git checkout -b feat/<change>`
2. Commit with a descriptive message; run `npm run lint` and `npm run build` before pushing
3. Push the branch and open a **Pull Request** for review (Netlify auto-generates a deploy preview)
4. Merge to `main` → production deploy

Do **not** commit `node_modules/`, `dist/`, or `.env` (`.gitignore` is in place).

---

## Troubleshooting

### "My Messages tab is empty / Not loading"
The inbox query needs a composite index. Two ways to fix:

1. **Recommended:** `firebase deploy --only firestore:indexes` (uses the versioned `firestore.indexes.json` in this repo), or
2. Click **Fix indexes in Firebase** on the error banner, then follow the link to create the index in the console.

If no chats exist yet, the empty state is expected — conversations are created when a buyer messages a seller from a listing or starts an admin chat.

### Unread badges never update
Same composite indexes as above; also check the browser console for `[notifications]` / `[unread-chats]` subscription errors.

### Permission errors after deploying rules
The rules in `firestore.rules` match the app's access patterns exactly. If you modified them, verify each page against the [Data Model](#data-model-firestore) and test in a staging project.

### Large bundle warning
The main chunk exceeds 500 kB (Firebase SDK). Consider `manualChunks` or route-level code-splitting if bundle size becomes a concern.

---

## License

Proprietary — see repository owners.
