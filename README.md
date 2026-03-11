# Pro Consult Frontend

Vue 3 + Vite + TypeScript + Pinia + Vue Router.

![Frontend CI](https://github.com/alextesshu/consult-frontend/actions/workflows/ci.yml/badge.svg?branch=dev)

## Requirements

- Node.js 20.9+ (Vite 5)

## Setup

Create `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

Install deps:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

## Testing

```bash
npm run test
```

Quality gate for PRs to `dev`/`main`:

```bash
npm run typecheck
npm run build
npm run test:run
```

## Routes (Key)

- `/` — Public Home (role choice + parallax scene)
- `/login` — Login
- `/signup` — Specialist signup
- `/cabinet` — Specialist dashboard
- `/cabinet/profile` — Specialist profile management
- `/cabinet/analytics` — Specialist analytics overview (Leader-gated insights)
- `/cabinet/group-events` — Group events (full lifecycle + participants + invites)
- `/cabinet/slots` — Slots (create/edit/delete)
- `/cabinet/sessions` — Specialist sessions (actions + notes + reschedule requests)
- `/cabinet/sessions/:id` — Specialist session detail
- `/cabinet/reviews` — Specialist reviews moderation
- `/cabinet/clients` — Specialist CRM (clients + archive/restore)
- `/cabinet/billing` — Plans & access (manual request)
- `/client` — Client dashboard (sessions + selected/viewed specialist)
- `/client/sessions/:id` — Client session detail (cancel/reschedule request)
- `/client/specialists` — Specialist list (choose + open profile)
- `/client/therapists` — Legacy alias for specialists list
- `/client/group-events/:id` — Client group event detail
- `/invite/:token` — Group invite join (client acceptance flow)
- `/public` — Redirect to `/t/:slug` (auto via profile)
- `/t/:slug` — Public specialist profile + booking
- `/specialists` — Public specialists catalog
- `/therapists` — Legacy alias for specialists catalog

## Auth

Signup uses email + password only (username auto-generated).

Login accepts email or username:

- If input contains `@` -> send as `email`
- Else -> send as `username`

Tokens are stored in localStorage and auto-refreshed via `/api/auth/token/refresh/`.

## Implemented UI (Frontend)

- **HomeView**: public landing with specialist/client choice + parallax layer stack
- **CabinetView**: account/entitlements overview + quick actions
- **ClientDashboardView**: client sessions list + selected/viewed specialists + intro price in cards
- **ClientSessionDetailView**: client cancel + reschedule request + reviews
- **ClientTherapistsView**: specialist list + open profile + intro price in cards
- **ClientGroupEventView**: client-facing group event detail
- **SlotsView**: create/edit/delete slots + fill day/week + date navigation
- **GroupEventsView**: full group lifecycle (create/schedule/start/complete/cancel), participants (roles/status), invites
- **TherapistSessionsView**: specialist actions + notes + reschedule requests + status/date filters
- **TherapistSessionDetailView**: specialist session detail with status actions, recurring flow, request context, and private note
- **TherapistReviewsView**: specialist review moderation (approve/hide/respond) + filters
- **TherapistClientsView**: specialist CRM with archive/restore
- **BillingView**: plans + access state + per-plan upgrade request (manual billing)
- **TherapistProfileView**: step-by-step profile editor, media upload preview, visibility toggles, public link
  - standard price + intro price (duration + currency)
  - visibility toggles: `show_price`, `show_intro_price`
- **PublicProfileView**: landing-style public profile + booking + trust/about/contact blocks + journal preview
- **PublicTherapistsView**: public specialists catalog with server-side filters + intro price in cards
- **LoginView / SignupView**: redesigned auth pages
- **System**: global toast/notification layer, notification bell with unread state, 404/403 pages, empty states, loading skeletons
- **Invites**: group invite join page with consent + status messaging

## Not Implemented Yet (Frontend Gaps)

### Client session actions
- Polished confirmation flows and status messaging

### Group events UX
- Participant list filtering (role/status), invite link copy, and inline moderation cues

### Specialist CRM
- Bulk actions and richer client profile view

### Billing / Entitlements UX
- Auto-billing integration (Stripe/Paddle) with live status updates
- Deeper UI states for GRACE / RESTRICTED / OVER_LIMIT

### System UX
- Expand empty/loading/error states across remaining views

### Quality / regression coverage
- View-level regression tests for large public-profile surfaces (`PublicProfileView`, `TherapistProfileView`)

## Notes

- Non-home pages are constrained to 80% width.
- Parallax layers live in `src/assets/parallax/`.
- Public profile data is fetched from `/api/public/specialists/{slug}/` (legacy alias: `/api/public/therapists/{slug}/`).
- Public-facing specialist name uses `First L.` format.
- Keep files saved in UTF-8 to avoid broken Ukrainian text.
- Analytics contract for the cabinet view is centralized in `src/lib/analytics.ts`.
- Backend interprets `date`, `date_from`, `date_to` filters as UTC day boundaries (send `YYYY-MM-DD` in UTC).
- Billing upgrade requests call `POST /api/billing/request-access/` with `requested_plan`.
- Client profile photos come from `/api/client/profile/` > `photo_url`.
  - If `photo_url` is present but image is missing, check GCS config on backend.
  - For signed URLs (`GCS_PUBLIC=false`), refresh the page to regenerate the URL.
- Persistent project handoff lives in `docs/HANDOFF.md` and is maintained as the current agent-facing status file.

## Next Focus

1. Public profile regression coverage (`PublicProfileView`, `TherapistProfileView`)
2. Client session confirmation and status messaging polish
3. System and product copy polish (empty/loading/error states, README and marketing consistency)



