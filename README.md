# Consult Frontend

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

* `/cabinet` — Therapist dashboard
* `/cabinet/profile` — Profile editor + public preview
* `/cabinet/group-events` ? Group events (list/create/delete drafts)

## Auth

Login accepts email or username:

* If input contains `@` -> send as `email`
* Else -> send as `username`

Tokens are stored in localStorage and auto-refreshed via `/api/auth/token/refresh/`.
