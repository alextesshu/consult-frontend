# Pro Consult Frontend

Vue 3 + Vite + TypeScript + Pinia + Vue Router.

## Requirements

* Node.js 20.9+ (Vite 5)

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

## Routes

* `/` — Public Home (role choice + parallax scene)
* `/login` — Login
* `/signup` — Therapist signup
* `/cabinet` — Therapist dashboard
* `/cabinet/profile` — Profile editor + public preview
* `/cabinet/group-events` — Group events (list/create/delete drafts)
* `/cabinet/slots` — Slots (create/edit/delete)
* `/client` — Client dashboard (sessions + selected/viewed therapist)
* `/client/therapists` — Therapist list (choose + open profile)
* `/public` — Redirect to `/t/:slug` (auto via profile)
* `/t/:slug` — Public therapist profile + booking

## Auth

Signup uses email + password only (username auto-generated).

Login accepts email or username:

* If input contains `@` -> send as `email`
* Else -> send as `username`

Tokens are stored in localStorage and auto-refreshed via `/api/auth/token/refresh/`.

## Implemented UI (Frontend)

* **HomeView**: public landing with therapist/client choice + parallax layer stack (no animation yet)
* **CabinetView**: account/entitlements overview + quick actions under the hero
* **ClientDashboardView**: client sessions list + selected therapist + viewed therapists
* **ClientTherapistsView**: therapist list + open profile
* **SlotsView**: create/edit/delete slots + fill day/week + date navigation
* **GroupEventsView**: list drafts + create drafts + entitlement status display
* **TherapistProfileView**: full profile editor, media upload preview, visibility toggles, public slug management
* **PublicProfileView**: real public profile data + upcoming slots list + booking CTA
* **LoginView / SignupView**: redesigned auth pages

## Notes

* Non-home pages are constrained to 80% width.
* Parallax layers live in `src/assets/parallax/`.
* Public profile data is fetched from `/api/public/therapists/{slug}/`.
