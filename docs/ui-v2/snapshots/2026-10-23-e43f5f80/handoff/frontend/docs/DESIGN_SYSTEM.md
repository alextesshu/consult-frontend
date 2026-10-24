# PRO CONSULT — Design System & Visual Migration Guide

> **Updated 2026-10-21 — UI v2.** Sections 5–12 and 15 describe the v2 visual layer (Onest, 16px cards, flat cream ground). v2 is opt-in via `<html data-ui="v2">`; see `docs/UI_MIGRATION_PLAN.md` §v2 and `PATCHES.md`. Everything else in this document (product rules, safety rules, migration principles) is unchanged.

## 1. Purpose

This document is the canonical design reference for the PRO CONSULT frontend.

The goal is **not** to rebuild the whole product from scratch.

The goal is to gradually align the existing product with a stronger, more premium, consistent visual style while preserving:

- existing routes
- existing business logic
- existing API contracts
- existing user flows
- existing permissions
- existing tests
- existing edge states
- existing role-specific behavior

This is an **evolutionary visual migration**, not a rewrite.

---

## 2. Core Product Identity

### Product name

**PRO CONSULT**

### Positioning

PRO CONSULT is a professional workspace for independent specialists who run a private practice.

Main product idea:

> Простір для ведення консультацій: публічний профіль, клієнтські запити, сесії, клієнтські записи, робочі матеріали й процеси в одній системі — без комісій з консультацій.

U2.7C product frame:

PRO CONSULT combines specialist public presence, ethical opt-in discovery,
no-registration client requests, request-to-session workflow for slot-based and
slotless requests, calendar and available time for requests, session
management, client records, private specialist workspace, explicitly published
client materials, blog/publications, tasks, practice workflow, and
payment-status boundaries.

Public specialist profile is a landing/presence surface controlled by the
specialist. `/specialists` is opt-in discovery/profile search, not an
aggressive marketplace. Product and design copy must not imply ratings, "top
specialists", paid ranking, commission from consultations, guaranteed clients,
or platform verification of specialist quality.

Request-first UX is the default public-profile posture. Selecting an available
window or leaving a request without selected time creates a request for the
specialist to review; it is not an automatically confirmed session.
Session readiness confirmation and payment proof/status are separate states.

Public profile booking is offer-first when offers are configured. Public offer
cards may represent `Консультація`, `Ознайомча сесія`, and `Парна консультація`.
The public UI must only show offers exposed by the backend: hidden intro
offers stay hidden, and couple consultation appears only when configured. The
available-time list is filtered by whether one selected public availability
window can fit the selected offer duration; do not imply multi-slot
reservation.

Guest request proposal states must stay calm and channel-aware:

- no active proposal: `Потребує рішення`;
- active email proposal with confirmed send: `Очікує відповідь клієнта`;
- active phone/Telegram/manual proposal: `Потрібно надіслати посилання`;
- email send failure: manual secure-link sharing fallback.

The raw proposal token is not persisted, so after reload the copy-link action
may be unavailable. UI copy must explain that a new proposal is needed if the
specialist did not copy a manual link immediately after creation.

Completed sessions may appear in schedule/calendar as muted archive items.
Calendar cards use compact `Завершено` copy and completed details are
read-only from the calendar surface. Past availability windows remain hidden.

Private notes, private notebook/workbook, internal client records, and practice
board content remain specialist-only. Client-visible materials are explicit
published artifacts and must not be described as shared private notes.
Specialist-uploaded public documents must be described as specialist-provided
materials, not platform-verified documents.

### Target users

Primary users:

- psychologists
- psychotherapists
- consultants
- coaches
- supervisors
- other private-practice specialists

Secondary users:

- clients submitting requests and attending sessions
- guests using external session links
- admins managing platform access and billing

### Visual mood

The interface should feel:

- calm
- trustworthy
- professional
- modern
- structured
- human
- premium, but not flashy
- clean, but not empty

Avoid:

- aggressive sales style
- overloaded SaaS clichés
- random gradients
- too many colors
- excessive animations
- childish illustrations
- noisy backgrounds
- redesigning functionality just for visual reasons

---

## 3. Visual Direction

The target visual style is based on the current PRO CONSULT identity:

- cream/off-white background
- deep navy primary color
- light teal accent
- warm peach accent
- soft pastel cards
- rounded panels
- clean dashboard-like layouts
- simple line icons
- large calm headings
- structured cards and sections
- strong whitespace
- soft decorative background shapes

Important:

Generated visual mockups are a **style reference**, not a source of truth for business rules.

Mockup text, prices, limits, labels, and sample data may be illustrative only.

The actual product truth must always come from:

- current backend contracts
- current frontend routes
- current product decisions
- current tariff logic
- current Ukrainian copy already approved in the app

---

## 4. Redesign Principle

### Main rule

Do not redesign the product by replacing complete pages with static mockups.

Instead:

1. preserve current functionality
2. identify reusable visual patterns
3. introduce shared tokens/components
4. migrate one page or one block at a time
5. run tests and smoke checks after each change

### What is allowed

Visual polish may change:

- spacing
- typography
- card styles
- button styles
- colors
- decorative elements
- layout density
- section hierarchy
- responsive behavior
- visual grouping of existing information

### What is not allowed without explicit approval

Do not casually change:

- routes
- API calls
- permission logic
- user roles
- session lifecycle logic
- payment logic
- request/session logic
- notification logic
- validation rules
- business copy with legal meaning
- tariff limits
- backend-driven state names
- existing tests
- existing smoke-check assumptions

---

## 5. Color — UI v2

> UI v2 (active under `<html data-ui="v2">`). Tokens live in `src/styles/tokens-v2.css`. Never hard-code a hex in components — use the variable.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Primary | `--pc-navy-900` | #12345A | Primary buttons, active nav, links, focus ring, progress |
| Primary hover | `--pc-navy-950` | #0E2D52 | Hover of primary |
| Primary pressed | `--pc-navy-800` | #183E68 | :active |
| Page | `--pc-bg-main` | #FBF9F5 | Default background, all pages (flat — no radial gradients) |
| Card | `--pc-bg-card` | #FFFFFF | Cards, inputs, panels |
| Soft | `--pc-bg-soft` | #F6F1EA | Inset blocks, segmented bg, ghost hover |
| Sunk | `--pc-bg-sunk` | #F1EBE2 | Idle chips, step bars, skeletons |
| Text main | `--pc-text-main` | #12233A | Headings, body on light |
| Text body | `--pc-text-body` | #3F4B5E | Long paragraphs |
| Text muted | `--pc-text-muted` | #657287 | Secondary copy (≥13px) |
| Text soft | `--pc-text-soft` | #8B95A7 | Meta, captions, placeholders only |
| Hairline | `--pc-border-hair` | #EDE7DE | Card borders, header divider |
| Border | `--pc-border` | #E6E0D8 | Input idle |
| Border strong | `--pc-border-strong` | #D4CCC2 | Input hover, card hover |
| Teal tint / ink | `--pc-teal-100` / `--pc-teal-ink` | #EEF8F7 / #1F5E5A | Soft positive tags, icon wells |
| Peach tint / ink | `--pc-peach-100` / `--pc-peach-ink` | #FFF1E3 / #8A4B16 | Warm highlights, "new" |
| Success | `--pc-success` / `-soft` | #2F7A55 / #EEF8F1 | Paid, confirmed |
| Warning | `--pc-warning` / `-soft` | #B5651F / #FFF1E3 | Awaiting, pending |
| Danger | `--pc-danger` / `-soft` | #B83232 / #FDE8E8 | Destructive, unpaid, errors |
| Info | `--pc-info` / `-soft` | #2F6FA8 / #EEF4FA | Planned, neutral info |

Rules:
- Navy is the only action color. Teal/peach are tints with their own ink color — never a button fill, never text on cream.
- Text on a tint always uses that tint's ink token (contrast ≥ 4.5:1).
- `--pc-text-soft` fails 4.5:1 on cream at body size — meta/captions only.
- Status color never carries meaning alone; the label says the state.

## 6. Typography — UI v2

Font: **Onest** 400 / 500 / 600 (Google Fonts, cyrillic subset). Replaces Inter in v2. Chosen for Cyrillic quality and a warmer, less generic texture than Inter.

| Token | Size | LH | Weight | Use |
| --- | --- | --- | --- | --- |
| `--pc-fs-display` | clamp(40px, 5vw, 60px) | 1.08, ls −0.03em | 500 | Home hero h1 only |
| `--pc-fs-h1` | clamp(32px, 3.4vw, 42px) | 1.18, ls −0.02em | 500 | Page / section titles |
| `--pc-fs-h2` | clamp(26px, 2.6vw, 32px) | 1.18 | 500 | Sub-sections, cabinet page title |
| `--pc-fs-h3` | 20px | 1.3 | 500 | Card titles |
| `--pc-fs-lead` | clamp(17px, 1.6vw, 19px) | 1.6 | 400 | Intro paragraph under h1 |
| `--pc-fs-body` | 16px | 1.6 | 400 | Body, inputs |
| `--pc-fs-ui` | 15px | 1 | 500 | Buttons, in-app controls |
| `--pc-fs-small` | 14px | 1.5 | 400/500 | Lists, nav, chips, labels |
| `--pc-fs-meta` | 13px | 1.45 | 400 | Meta, hints, tags |
| `--pc-fs-micro` | 12px | 1.3 | 500, uppercase, ls .08em | Kickers only |

Rules:
- Headings are **500**, never 700. Hierarchy comes from size and space. 600 only for numbers (dashboard counters, prices).
- Body weight is 400 (v1 used 200 — unreadable in Cyrillic at 14–16px).
- `text-wrap: balance` on headings, `pretty` on paragraphs.

## 7. Layout System — UI v2

- Container: `--pc-container` 1240px, gutter `clamp(20px, 4vw, 48px)`.
- Spacing: 4px base — 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96 (`--pc-space-*`).
- Section rhythm: `--pc-section-y` = clamp(56px, 8vw, 104px).
- Public pages are left-aligned; content hugs the left, whitespace on the right. Centered text only for single short CTAs.
- Public profile: `minmax(0,1fr) 380px` with the request panel sticky at top 96px; below 860px the panel becomes a bottom sheet.
- Cabinet: `minmax(0,1fr) minmax(320px, 400px)`, gap 24px; single column below 960px.
- Prefer flex/grid + `gap` over margins between siblings.

## 8. Shape, Radius, Shadow — UI v2

Decision: **16px is the card radius**, inside a scale. Supersedes `UI_SHAPE_STANDARD.md` (2–4px) for v2; that document remains valid for v1 only.

| Token | Value | Use |
| --- | --- | --- |
| `--pc-radius-xs` | 8px | Tags, small badges, avatar thumbs, password toggle |
| `--pc-radius-sm` | 12px | Inputs, square buttons, menus, dropdowns |
| `--pc-radius-md` | **16px** | Cards, panels, sticky request panel, list items |
| `--pc-radius-lg` | 24px | Hero blocks, large section cards, dialogs, bottom sheets |
| `--pc-radius-pill` | 999px | Primary CTAs, chips, segmented control, status pills |

Nested radius: inner = outer − padding (e.g. a 16px card with 8px inset holds 8px children).

Elevation — one shadow per element, never stacked:

| Token | Value | Use |
| --- | --- | --- |
| `--pc-shadow-sm` | 0 4px 12px rgba(18,35,58,.08) | Active segment, card hover |
| `--pc-shadow-md` | 0 16px 40px rgba(18,35,58,.08) | Raised cards, request panel |
| `--pc-shadow-lg` | 0 24px 60px rgba(18,35,58,.10) | Dialogs, bottom sheet, live UI card on Home |
| `--pc-ring` | 0 0 0 4px rgba(18,52,90,.08) | Input focus halo |

Default cards are flat (hairline border, no shadow).

## 9. Buttons — UI v2

Classes in `components-v2.css`.

| Variant | Class | Look | Use |
| --- | --- | --- | --- |
| Primary | `.pc2-btn--primary` | Navy fill, white text, pill | One per view: main action |
| Secondary | `.pc2-btn--secondary` | 1px navy outline → fills navy on hover | Second action |
| Ghost | `.pc2-btn--ghost` | Muted text → soft bg on hover | Tertiary, "Назад", "Скасувати" |
| Danger | `.pc2-btn--danger` | Red text + 40% red outline | Destructive, always with confirm |

Sizes: default 48px, `--lg` 56px (hero, auth submit), `--sm` 36px (in-row actions). `--square` switches to 12px radius for dense toolbars/tables.

States (borrowed logic from Nocturne, our colors): hover = one ramp step darker; pressed = `--pc-navy-800`; keyboard focus = `:focus-visible` 2px navy outline, 2px offset; disabled = 45% opacity, no pointer events. Never leave browser-default focus.

## 10. Cards — UI v2

`.pc2-card`: white, 1px `--pc-border-hair`, 16px radius, 24px padding, **no shadow**.
Modifiers: `--lg` (24px radius, clamp(24px,3vw,36px) padding), `--soft` (cream-soft fill, no border), `--raised` (`--pc-shadow-md`), `--interactive` (hover: strong border + sm shadow).
Kicker: `.pc2-kicker` 12px uppercase soft text above the title.
Max two card styles per screen.

## 11. Badges and Statuses — UI v2

`.pc2-tag` (8px radius) or `.pc2-tag--pill`. Tones: teal, peach, neutral, success, warning, danger, info — each pairs a soft bg with its ink color. Status names come from the backend unchanged (§2): `Потребує рішення`, `Очікує відповідь клієнта`, `Потрібно надіслати посилання`, `Завершено`.

## 12. Inputs and Forms — UI v2

- `.pc2-input`: 48px (app) / 54px `--lg` (auth, public forms), 12px radius, 1.5px `--pc-border`, white, 16px text (prevents iOS zoom).
- Hover: `--pc-border-strong`. Focus: navy border + `--pc-ring`. Invalid: `aria-invalid="true"` → danger border + `.pc2-error` text below.
- Label above field (14px/500), hint below (13px muted). No floating labels.
- **Password: single field + "Показати / Сховати" toggle** (`.pc2-password`). No "repeat password" field. Min 8 chars hint shown before typing. Applies to specialist and client signup and password reset.
- Signup is minimal: name, email, password + one question as chips (`.pc2-chips`). Everything else moves to onboarding after the first login.
- Multi-step flows show `.pc2-steps` bars; progressive disclosure uses `.pc2-reveal` (grid-rows transition, 400ms).
- Preserve all existing validation, backend error mapping, loading and disabled states.

### Motion
Barely noticeable: 150 / 200 / 400ms, `cubic-bezier(.4,0,.2,1)`. Only opacity, color, border, small translate (≤8px), grid-rows. No bounce, no parallax, no scroll-jacking. `prefers-reduced-motion` collapses everything to 1ms.

## 13. Tables and Lists

Tables should be used only when comparison or structured data is necessary.

Good use cases:

- pricing comparison
- admin lists
- billing history
- client/session data

Table rules:

- avoid dense spreadsheet feeling
- use enough row height
- keep headers sticky only when useful
- maintain mobile fallback

On mobile, prefer:

- cards
- stacked rows
- horizontal scroll only when unavoidable

---

## 14. Decorative Elements

Allowed decorative elements:

- dotted patterns
- soft circles
- large abstract rounded shapes
- peach/teal/navy background blobs
- light grid accents
- subtle illustration-style cards

Preferred implementation:

- CSS pseudo-elements
- inline SVG
- reusable decorative components
- lightweight SVG assets

Rules:

- decorations must not block content
- decorations must not reduce contrast
- decorations must not cause horizontal overflow
- decorations should be hidden or simplified on mobile
- decorative images should not be required for layout stability

---

## 15. Icon Style

Phosphor Icons (Regular weight, 1.5px look), 16 / 20 / 24px, `currentColor`. Icon wells: 40px, 12px radius, teal-100 or peach-100 bg with the matching ink. Rules from v1 below still apply.

### v1 rules (still valid)

Target icon style:

- simple line icons
- rounded stroke
- consistent stroke width
- navy/teal based
- minimal detail

Preferred implementation options:

1. existing icon library if already used in the project
2. inline SVG components
3. custom SVG asset pack

Icon rules:

- do not mix many different icon styles
- avoid filled emoji-like icons in core UI
- keep icons secondary to text
- every icon-only button must have accessible label

---

## 16. Public Page Patterns

Public pages should feel more spacious and marketing-oriented.

Applicable pages:

- Home
- Pricing
- Public specialist profile
- Blog
- Blog detail
- Contacts
- About
- FAQ
- Login/Register

Common structure:

1. Header
2. Hero / page intro
3. Main content sections
4. CTA block where appropriate
5. Footer

Public page header should include:

- logo
- navigation
- login link
- primary CTA

Public page footer should include:

- product description
- product links
- company links
- support links
- legal links
- language selector if present
- newsletter only if implemented or approved

---

## 17. Authenticated Workspace Patterns

Authenticated pages should feel like a working cockpit.

Applicable pages:

- Specialist dashboard
- Sessions
- Clients
- Client detail
- Calendar / availability windows
- Messages
- Materials
- Payments / billing
- Settings
- External sessions
- Admin pages

Workspace pages should prioritize:

- speed
- clarity
- low friction
- next action visibility
- status visibility
- compact but readable layout

Authenticated pages should avoid:

- marketing-style hero sections
- excessive decoration
- large empty banners
- hiding important operational states
- changing workflows just for aesthetics

---

## 18. Page Migration Strategy

This table defines the safe direction for visual migration.

| Page                             |         Current status | Priority | Risk level | Migration approach                                        | Notes                                                                                                |
| -------------------------------- | ---------------------: | -------: | ---------: | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Home                             |            Implemented |     High |     Medium | Align with new public-page visual system                  | Preserve current CTA logic, pricing copy, route links                                                |
| Pricing / Billing public section | Implemented / evolving |     High |       High | Polish visuals only after confirming current tariff truth | Follow current beta/access and tariff docs; do not invent speculative prices |
| Public specialist profile        |            Implemented |     High |       High | Improve layout, trust markers, CTA clarity                | Do not break request-to-session flow, slug route, visibility rules                                   |
| Specialist cabinet / dashboard   |            Implemented |     High |       High | Gradually improve dashboard cards and work queue          | Preserve onboarding, entitlements, role logic                                                        |
| Sessions list                    |            Implemented |     High |       High | Improve visual grouping and status badges                 | Do not break filters, status logic, payment badges                                                   |
| Session detail                   |            Implemented |     High |       High | Polish panels and primary actions                         | Preserve complete/cancel/reschedule/payment/note/workbook logic                                      |
| Clients list                     |            Implemented |     High |     Medium | Improve cards, search, note reminders                     | Preserve notes reminder behavior and returnTo flow                                                   |
| Client detail                    |            Implemented |   Medium |       High | Improve information architecture                          | Preserve journal, notes, sessions, client relationship logic                                         |
| External sessions                |            Implemented |     High |       High | Improve guest invite safety UX                            | Guest invite must be primary sharing path, raw meeting URL must not look shareable                   |
| Billing                          |            Implemented |     High |       High | Improve tariff cards and entitlement visibility           | Do not alter tariff business logic                                                                   |
| Settings                         |            Implemented |   Medium |     Medium | Improve grouping and forms                                | Preserve payment details, profile, account settings                                                  |
| Login/Register                   |            Implemented |   Medium |     Medium | Align with public style                                   | Preserve auth flow, errors, redirects                                                                |
| Blog                             | Implemented or planned |      Low |        Low | Apply public-page card style                              | Can be polished after core flows                                                                     |
| Contacts/About                   | Implemented or planned |      Low |        Low | Apply public-page style                                   | Lower priority                                                                                       |
| Admin pages                      |            Implemented |   Medium |       High | Improve clarity, not marketing style                      | Do not change admin access model                                                                     |

---

## 19. Implementation Phases

### Phase 1 — Design documentation and visual tokens

Goal:

- document visual direction
- define CSS variables
- avoid chaotic redesign

Tasks:

- create/update this document
- audit existing CSS variables
- map current colors to new tokens
- identify shared components that already exist

No major page redesign in this phase.

---

### Phase 2 — Shared layout primitives

Goal:

- create reusable building blocks before touching many pages

Possible components:

- public page container
- section header
- card
- CTA banner
- pricing card
- dashboard card
- status badge
- empty state
- attention state
- decorative background component

Rules:

- components must be incremental
- do not force all pages to migrate immediately
- avoid breaking existing pages

---

### Phase 3 — Public pages polish

Recommended order:

1. Home
2. Pricing
3. Public specialist profile
4. Login/Register
5. About/Contacts/FAQ
6. Blog

Safety:

- preserve route links
- preserve public request and session flow
- preserve public profile visibility logic
- preserve Ukrainian copy already approved

---

### Phase 4 — Specialist dashboard polish

Recommended scope:

- main cabinet/dashboard layout
- summary cards
- work queue
- today schedule
- quick actions
- notification/message previews

Safety:

- preserve data source
- preserve onboarding state
- preserve entitlements
- preserve role-specific behavior

---

### Phase 5 — Workflow pages polish

Recommended pages:

- Sessions
- Session detail
- Clients
- Client detail
- External sessions
- Materials
- Payments
- Settings

Safety:

- do not change business logic
- do not change endpoint usage
- do not remove edge states
- do not remove confirmations
- do not hide critical warnings

---

### Phase 6 — Mobile polish

Goal:

- no horizontal overflow
- clear CTAs
- readable cards
- safe sidebar/header behavior
- usable request/session flow
- usable dashboard cards

Every migrated page must be checked on mobile.

Recommended viewport checks:

- 360px
- 390px
- 430px
- 768px
- desktop

---

### Phase 7 — Final visual QA

Checklist:

- consistent header/footer
- consistent buttons
- consistent cards
- consistent status badges
- consistent spacing
- no broken mobile layout
- no missing states
- no untranslated UI
- no mock prices or placeholder data in production UI
- no broken routes
- tests pass
- build passes

---

## 20. Safety Rules for AI / Codex Agents

Any AI or Codex agent working on frontend visual polish must follow these rules.

### Must do

- read this document before changing UI
- keep changes page-scoped
- preserve existing functionality
- preserve tests
- preserve route names
- preserve API contracts
- preserve loading/error/empty states
- preserve accessibility labels
- preserve mobile behavior
- update or add tests when behavior or visible states are affected

### Must not do

- do not replace working pages with static mockup HTML
- do not remove existing state handling
- do not remove role-specific branches
- do not rename routes casually
- do not change backend contracts
- do not change business logic during visual polish
- do not hardcode mock data into real pages
- do not use mockup prices as product truth
- do not remove warnings, permissions, or confirmations
- do not remove tests to make build pass
- do not introduce large image dependencies where CSS/SVG is enough

---

## 21. Product Truth vs Visual Mockups

Visual mockups are used only for:

- mood
- hierarchy
- layout inspiration
- component style
- color direction
- spacing direction
- marketing composition

Visual mockups are not authoritative for:

- prices
- tariff limits
- legal copy
- API fields
- business rules
- role permissions
- request/session rules
- payment rules
- notification rules
- exact production copy

When in doubt, preserve the current implemented behavior.

---

## 22. Current Tariff Truth

As of the current product direction:

### Start

- free
- limited by active client count according to current backend entitlement logic

### Pro

- 990 грн / month
- 9,900 грн / year

### Leader

- 2,490 грн / month
- 24,900 грн / year
- self-service may be disabled during beta depending on current backend rules

Important:

Do not use old mockup prices such as 299 / 599 / 999 unless the product decision is explicitly changed.

---

## 23. Copy and Language Rules

Primary UI language:

- Ukrainian

Product name:

- PRO CONSULT

Preferred product wording:

- простір
- приватна практика
- спеціаліст
- клієнт
- сесія
- онлайн-запис
- робочі матеріали
- Робочий зошит
- без комісій з оплат

Avoid mixing unnecessary English words in Ukrainian UI.

Allowed English:

- brand names
- technical labels where already used intentionally
- internal code identifiers

Do not use:

- “workflow” in visible Ukrainian UI if a good Ukrainian equivalent exists
- “external sessions” in visible Ukrainian UI if “Гостьові сесії” is the product term
- “client workbook” in visible Ukrainian UI; use “Робочий зошит”

---

## 24. Accessibility Rules

Every visual migration should preserve or improve accessibility.

Required:

- text contrast must remain readable
- buttons must have visible focus states
- icon-only buttons must have accessible labels
- forms must keep labels or accessible names
- status must not be communicated by color only
- errors must be readable and close to the relevant field
- keyboard navigation must not be broken
- modal focus behavior must be preserved

---

## 25. Performance Rules

The visual redesign should not make the app heavy.

Prefer:

- CSS shapes
- inline SVG
- optimized SVG assets
- existing icon library
- reusable components

Avoid:

- large PNG backgrounds
- unoptimized hero images
- heavy animation libraries just for decoration
- multiple large custom font files
- decorative assets that block rendering

---

## 26. Smoke Checks After Every Visual Migration

After each page-level visual migration, run at least:

### Development check

- page opens without console errors
- main route still works
- main CTA still works
- loading state still works
- error state still works where applicable
- empty state still works where applicable

### Mobile check

- no horizontal overflow
- primary CTA visible
- text not clipped
- cards stack correctly
- sidebar/header does not cover content

### Product check

- no business logic changed
- no route changed
- no API contract changed
- no mock data introduced
- no approved Ukrainian copy accidentally replaced

### Test/build check

- relevant unit tests pass
- build passes
- existing snapshots, if any, are intentionally updated only when needed

---

## 27. Priority for Near-Term Visual Work

Recommended near-term order:

1. Create/confirm visual tokens
2. Create reusable card/button/badge patterns
3. Polish Home page
4. Polish Pricing/Billing public presentation
5. Polish Public specialist profile
6. Polish Specialist dashboard
7. Polish Sessions and Clients pages
8. Polish External sessions guest invite safety UX
9. Polish Settings and Billing
10. Mobile QA pass

---

## 28. Final Design Direction Summary

The target PRO CONSULT UI should feel like:

> A calm, premium, professional SaaS workspace for private-practice specialists, where public pages build trust and conversion, and authenticated pages help specialists work faster every day.

The redesign must improve the product without losing the product.
