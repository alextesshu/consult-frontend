# PRO CONSULT — Design System & Visual Migration Guide

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

> Простір для спеціалістів приватної практики: публічний профіль, клієнтські запити, сесії, клієнтські записи, робочі матеріали й процеси в одній системі — без комісій з консультацій.

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

Private notes, private notebook/workbook, internal client records, and practice
board content remain specialist-only. Client-visible materials are explicit
published artifacts and must not be described as shared private notes.

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

## 5. Brand Color Palette

Use CSS variables where possible.

Recommended target variables:

```css
:root {
  --pc-navy-950: #0E2D52;
  --pc-navy-900: #12345A;
  --pc-navy-800: #183E68;

  --pc-bg-main: #FAF7F2;
  --pc-bg-card: #FFFFFF;
  --pc-bg-soft: #F6F1EA;

  --pc-teal-500: #8FCBC8;
  --pc-teal-200: #DDF1EF;
  --pc-teal-100: #EEF8F7;

  --pc-peach-500: #F7B77E;
  --pc-peach-200: #FFE2C4;
  --pc-peach-100: #FFF1E3;

  --pc-blue-soft: #EEF4FA;
  --pc-green-soft: #EEF8F1;
  --pc-yellow-soft: #FFF5DF;
  --pc-red-soft: #FDECEC;

  --pc-text-main: #12233A;
  --pc-text-muted: #657287;
  --pc-text-soft: #8B95A7;

  --pc-border: #E6E0D8;
  --pc-border-strong: #D4CCC2;

  --pc-success: #2F9E6D;
  --pc-warning: #D98A2B;
  --pc-danger: #C94444;
  --pc-info: #2F6FA8;
}
````

### Usage rules

Hard rule:

- Navy is the global primary brand and action color.
- Green/teal is not the default success or primary UI color.
- Green/teal may be used only as a very small decorative accent and must not dominate workspace UI.

#### Navy

Use for:

- primary buttons
- main headings
- sidebar active states
- authenticated topbar primary action
- active navigation
- footer background
- important UI anchors

Do not overuse navy as full-page background except in footers or specific CTA sections.

#### Cream background

Use as the default public-page background.

Good for:

- home
- pricing
- public profile
- blog
- contacts
- auth pages

#### White cards

Use for:

- feature cards
- pricing cards
- profile blocks
- dashboard cards
- settings panels
- forms

#### Teal

Use for:

- soft highlights
- neutral positive accents
- decorative shapes
- icon backgrounds
- secondary UI emphasis

#### Peach

Use for:

- warm CTA accents
- visual depth
- background shapes
- soft warning-neutral highlights

#### Red / danger

Use only for real attention states:

- unpaid sessions
- destructive actions
- critical errors
- failed payments
- urgent warnings

Do not use red for decorative purposes.

---

## 6. Typography

### General rule

Typography should be calm, readable, and structured.

Avoid decorative fonts.

Recommended font family:

```css
font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

### Public pages

Hero heading:

```css
font-size: clamp(40px, 5vw, 72px);
line-height: 1.05;
font-weight: 700;
letter-spacing: -0.04em;
```

Section heading:

```css
font-size: clamp(28px, 3vw, 42px);
line-height: 1.15;
font-weight: 700;
letter-spacing: -0.03em;
```

Card title:

```css
font-size: 18px;
line-height: 1.3;
font-weight: 700;
```

Body text:

```css
font-size: 16px;
line-height: 1.6;
font-weight: 400;
```

Small text:

```css
font-size: 13px;
line-height: 1.45;
```

### App / cabinet pages

Page heading:

```css
font-size: 28px;
line-height: 1.2;
font-weight: 700;
```

Dashboard card number:

```css
font-size: 32px;
line-height: 1;
font-weight: 700;
```

Panel title:

```css
font-size: 18px;
line-height: 1.3;
font-weight: 700;
```

Table/list body:

```css
font-size: 14px;
line-height: 1.5;
```

---

## 7. Layout System

### Page containers

Public pages should use a consistent max-width container.

Recommended:

```css
--pc-container: 1180px;
--pc-container-wide: 1320px;
```

Suggested pattern:

```css
.pc-container {
  width: min(100% - 32px, var(--pc-container));
  margin-inline: auto;
}
```

On mobile:

```css
width: min(100% - 20px, var(--pc-container));
```

### Spacing scale

Recommended spacing tokens:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Section rhythm

Public page section padding:

```css
padding-block: clamp(56px, 8vw, 104px);
```

Compact sections:

```css
padding-block: clamp(40px, 6vw, 72px);
```

### Dashboard layout

Authenticated specialist pages should prefer:

- left sidebar
- main content grid
- cards with clear grouping
- important actions above the fold
- dense but readable lists
- no visual clutter

Typical dashboard grid:

```css
display: grid;
grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
gap: 24px;
```

On mobile:

```css
grid-template-columns: 1fr;
```

---

## 8. Shape, Radius, Shadow

### Border radius

Recommended:

```css
--pc-radius-sharp: 2px;
--pc-radius-card: 4px;
--pc-radius-panel: 4px;
--pc-radius-control: 4px;
--pc-radius-pill: 999px;
```

Usage:

- workspace cards/panels/sidebar/menus/form blocks: `2px` to `4px`
- buttons/controls: `4px` unless intentionally pill-like
- badges/status pills/chips: pill

### Shadows

Use soft shadows only.

Recommended:

```css
--shadow-card: 0 16px 40px rgba(18, 35, 58, 0.08);
--shadow-soft: 0 8px 24px rgba(18, 35, 58, 0.06);
--shadow-float: 0 24px 80px rgba(18, 35, 58, 0.12);
```

Avoid harsh black shadows.

---

## 9. Buttons

### Primary button

Use for main conversion or main page action.

Visual:

- deep navy background
- white text
- rounded
- clear hover state

Example:

```css
.pc-btn-primary {
  background: var(--pc-navy-900);
  color: #fff;
  border: 1px solid var(--pc-navy-900);
  border-radius: 12px;
  font-weight: 700;
  min-height: 44px;
  padding: 0 20px;
}
```

### Secondary button

Use for secondary actions.

Visual:

- white or transparent background
- navy text
- navy border

### Soft button

Use for dashboard quick actions.

Visual:

- pastel background
- icon + label
- gentle hover

### Dangerous button

Use only for destructive actions.

Visual:

- red text or red background depending on severity
- must not be confused with primary CTA

---

## 10. Cards

Cards are one of the main design primitives.

Default card:

```css
.pc-card {
  background: var(--pc-bg-card);
  border: 1px solid var(--pc-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  padding: 24px;
}
```

### Card rules

Cards should:

- group related information
- have clear headings
- avoid excessive nested borders
- use badges sparingly
- have consistent internal spacing

Avoid:

- too many different card styles on one page
- dense borders everywhere
- mixing too many background colors

---

## 11. Badges and Statuses

Badges should be small, readable, and semantically colored.

### Common statuses

#### Success

Use for:

- paid
- completed
- confirmed
- active

#### Info

Use for:

- planned
- upcoming
- scheduled
- neutral information

#### Warning

Use for:

- awaiting confirmation
- pending payment
- missing optional but useful setup
- incomplete non-critical action

#### Danger

Use for:

- unpaid important sessions
- failed payment
- invalid state
- expired critical access
- destructive state

### Important

Do not use status color only. Text must clearly explain the state.

---

## 12. Inputs and Forms

Inputs should be:

- readable
- calm
- not too compact
- visually aligned with cards and buttons

Recommended:

```css
.pc-input {
  min-height: 44px;
  border: 1px solid var(--pc-border);
  border-radius: 12px;
  background: #fff;
  color: var(--pc-text-main);
  padding: 0 14px;
}
```

Focus state:

```css
.pc-input:focus {
  border-color: var(--pc-teal-500);
  box-shadow: 0 0 0 3px rgba(143, 203, 200, 0.25);
}
```

Forms should preserve:

- validation messages
- backend error mapping
- required field indicators
- helper text
- disabled states
- loading states
- success states

---

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
