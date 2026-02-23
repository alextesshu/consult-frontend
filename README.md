# Pro Consult Frontend

Vue 3 + Vite + TypeScript + Pinia + Vue Router.

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

## Routes (Key)

- `/` — Public Home (role choice + parallax scene)
- `/login` — Login
- `/signup` — Therapist signup
- `/cabinet` — Therapist dashboard
- `/cabinet/profile` — Therapist profile management
- `/cabinet/group-events` — Group events (full lifecycle + participants + invites)
- `/cabinet/slots` — Slots (create/edit/delete)
- `/cabinet/sessions` — Therapist sessions (actions + notes + reschedule requests)
- `/cabinet/reviews` — Therapist reviews moderation
- `/cabinet/clients` — Therapist CRM (clients + archive/restore)
- `/cabinet/billing` — Plans & access (manual request)
- `/client` — Client dashboard (sessions + selected/viewed therapist)
- `/client/sessions/:id` — Client session detail (cancel/reschedule request)
- `/client/specialists` — Specialist list (choose + open profile)
- `/client/therapists` — Legacy alias for specialists list
- `/client/group-events/:id` — Client group event detail
- `/invite/:token` — Group invite join (client acceptance flow)
- `/public` — Redirect to `/t/:slug` (auto via profile)
- `/t/:slug` — Public therapist profile + booking
- `/specialists` — Public specialists catalog
- `/therapists` — Legacy alias for specialists catalog

## Auth

Signup uses email + password only (username auto-generated).

Login accepts email or username:

- If input contains `@` -> send as `email`
- Else -> send as `username`

Tokens are stored in localStorage and auto-refreshed via `/api/auth/token/refresh/`.

## Implemented UI (Frontend)

- **HomeView**: public landing with therapist/client choice + parallax layer stack
- **CabinetView**: account/entitlements overview + quick actions
- **ClientDashboardView**: client sessions list + selected/viewed therapists + intro price in cards
- **ClientSessionDetailView**: client cancel + reschedule request + reviews
- **ClientTherapistsView**: therapist list + open profile + intro price in cards
- **ClientGroupEventView**: client-facing group event detail
- **SlotsView**: create/edit/delete slots + fill day/week + date navigation
- **GroupEventsView**: full group lifecycle (create/schedule/start/complete/cancel), participants (roles/status), invites
- **TherapistSessionsView**: therapist actions + notes + reschedule requests
- **TherapistReviewsView**: review moderation (approve/hide/respond) + filters
- **TherapistClientsView**: therapist CRM with archive/restore
- **BillingView**: plans + access state + per-plan upgrade request (manual billing)
- **TherapistProfileView**: step-by-step profile editor, media upload preview, visibility toggles, public link
  - standard price + intro price (duration + currency)
  - visibility toggles: `show_price`, `show_intro_price`
- **PublicProfileView**: public profile + upcoming slots + booking
- **PublicTherapistsView**: public catalog with server-side filters + intro price in cards
- **LoginView / SignupView**: redesigned auth pages
- **System**: global toast/notification layer, notification bell with unread state, 404/403 pages, empty states, loading skeletons
- **Invites**: group invite join page with consent + status messaging

## Not Implemented Yet (Frontend Gaps)

### Therapist sessions
- Session detail page for therapists
- Filters (status/date)

### Client session actions
- Polished confirmation flows and status messaging

### Group Room UX
- Participant list filtering (role/status), invite link copy, and inline moderation cues

### Therapist CRM
- Bulk actions and richer client profile view

### Billing / Entitlements UX
- Auto-billing integration (Stripe/Paddle) with live status updates
- Deeper UI states for GRACE / RESTRICTED / OVER_LIMIT

### Public catalog
- Filters by rating/experience (future)

### Ratings & reviews
- Moderation-ready UI states and review editing policy

### System UX
- Expand empty/loading states across remaining views

## Notes

- Non-home pages are constrained to 80% width.
- Parallax layers live in `src/assets/parallax/`.
- Public profile data is fetched from `/api/public/specialists/{slug}/` (legacy alias: `/api/public/therapists/{slug}/`).
- Public-facing therapist name uses `First L.` format.
- Keep files saved in UTF-8 to avoid broken Ukrainian text.
- Backend interprets `date`, `date_from`, `date_to` filters as UTC day boundaries (send `YYYY-MM-DD` in UTC).
- Billing upgrade requests call `POST /api/cabinet/billing/request-access/` with `requested_plan`.

## Next Focus

1. Ratings & reviews (moderation UX)
2. System UX polish (empty/loading states)
