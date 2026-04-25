# PRO CONSULT — UI Migration Plan

## 1. Purpose

This document defines the safe visual migration plan for the PRO CONSULT frontend.

The goal is to move the existing product toward the new visual direction without losing implemented functionality.

This is not a rewrite.

This is a controlled, page-by-page visual migration.

Main rule:

> Preserve the product. Improve the interface.

---

## 2. Related Documents

Before working on any visual migration task, read:

```text
frontend/docs/DESIGN_SYSTEM.md
````

`DESIGN_SYSTEM.md` defines:

* visual direction
* color system
* typography
* cards
* buttons
* layout rules
* safety rules
* AI/Codex agent rules

This document defines:

* page order
* migration phases
* risk levels
* smoke checks
* task boundaries

---

## 3. Core Migration Rules

### Must preserve

Every migration task must preserve:

* existing routes
* existing API calls
* existing business logic
* existing permission logic
* existing role-specific UI
* existing loading states
* existing error states
* existing empty states
* existing tests
* current Ukrainian product terminology

### Must avoid

Do not:

* replace working pages with static mockups
* hardcode generated mockup data into real pages
* use mockup prices as real tariff truth
* remove conditions just because they complicate layout
* remove warning states
* remove confirmation flows
* rename routes
* change backend contracts
* mix unrelated visual polish with business logic changes

### Allowed

Visual migration may change:

* spacing
* card layout
* typography
* colors
* button style
* badge style
* section hierarchy
* decorative elements
* responsive layout
* visual grouping of existing data

---

## 4. Product Truth

Generated design mockups are visual references only.

They are useful for:

* style
* spacing
* hierarchy
* page mood
* component direction
* decorative language

They are not truth for:

* prices
* tariff limits
* routes
* copy with legal meaning
* API fields
* user roles
* business rules
* payment flow
* booking flow
* notification rules

When mockups conflict with implemented product logic, the implemented product logic wins.

---

## 5. Current Tariff Truth

As of the current product decision:

### Start

* free
* active client limit is controlled by backend entitlement logic

### Pro

* 990 грн / month
* 9,900 грн / year

### Leader

* 2,490 грн / month
* 24,900 грн / year
* self-service may be disabled during beta depending on backend rules

Do not use old generated prices such as:

* 299 грн
* 599 грн
* 999 грн

unless the product decision is explicitly changed.

---

## 6. Page Inventory and Migration Table

| Page / Area               | Route / Area                                         |         Current status | Priority |   Risk | Migration approach                                                     |
| ------------------------- | ---------------------------------------------------- | ---------------------: | -------: | -----: | ---------------------------------------------------------------------- |
| Home                      | `/`                                                  |            Implemented |     High | Medium | Align with new public landing style, preserve CTA and navigation logic |
| Pricing / tariffs         | public pricing area + `/cabinet/billing` related CTA | Implemented / evolving |     High |   High | Polish visuals only after confirming tariff truth                      |
| Public specialist profile | `/s/:slug`                                           |            Implemented |     High |   High | Improve trust, profile layout, booking clarity                         |
| Specialist dashboard      | `/cabinet`                                           |            Implemented |     High |   High | Improve cockpit layout, cards, work queue, quick actions               |
| Sessions list             | `/cabinet/sessions`                                  |            Implemented |     High |   High | Improve status readability and grouping                                |
| Session detail            | session detail route                                 |            Implemented |     High |   High | Polish panels/actions, preserve lifecycle logic                        |
| Clients list              | `/cabinet/clients`                                   |            Implemented |     High | Medium | Improve cards, reminders, search, batch workflow                       |
| Client detail             | client detail route                                  |            Implemented |   Medium |   High | Improve information architecture only                                  |
| External sessions         | `/cabinet/external-sessions`                         |            Implemented |     High |   High | Improve guest invite safety UX                                         |
| External session detail   | `/cabinet/external-sessions/:id`                     |            Implemented |     High |   High | Make guest invite the primary sharing action                           |
| Settings                  | `/cabinet/settings` or related settings pages        |            Implemented |   Medium | Medium | Improve grouping/forms, preserve all saved fields                      |
| Payment details           | settings/payment details area                        |            Implemented |     High |   High | Polish only, preserve IBAN/card method logic                           |
| Billing                   | `/cabinet/billing`                                   |            Implemented |     High |   High | Improve entitlement/tariff visibility                                  |
| Login/Register            | auth routes                                          |            Implemented |   Medium | Medium | Align with public visual style                                         |
| Blog                      | blog routes                                          |    Implemented/planned |      Low |    Low | Apply public card style later                                          |
| Contacts/About            | public routes                                        |    Implemented/planned |      Low |    Low | Lower priority                                                         |
| Admin pages               | `/admin/*`                                           |            Implemented |   Medium |   High | Improve clarity only, do not alter admin access logic                  |

---

## 7. Recommended Migration Phases

## Phase 1 — Documentation and Visual Tokens

### Phase 1 Goal

Prepare the system for safe migration.

### Scope

* `DESIGN_SYSTEM.md`
* `UI_MIGRATION_PLAN.md`
* CSS variables audit
* shared component audit

### Allowed changes

* documentation
* comments
* optional non-breaking CSS variable additions

### Avoid

* page redesign
* route changes
* business logic changes

### Done when

* design direction is documented
* migration plan is documented
* current CSS/global style structure is understood

---

## Phase 2 — Shared UI Foundations

### Phase 2 Goal

Create reusable primitives before redesigning pages.

### Candidate components/styles

* page container
* public section wrapper
* section heading
* card
* button variants
* badge variants
* empty state
* attention state
* CTA banner
* dashboard metric card
* pricing card
* decorative background elements

### Principle

Do not migrate every page immediately.

Create primitives gradually and apply only where safe.

### Risk

Medium.

Shared styles can accidentally affect many pages.

### Safety

Prefer additive classes or components.

Avoid changing global styles too broadly.

---

## Phase 3 — Public Pages Visual Polish

### Phase 3 Goal

Improve first impression and conversion.

### Recommended order

1. Home
2. Pricing / tariffs presentation
3. Public specialist profile
4. Login/Register
5. Contacts/About/FAQ
6. Blog

### Why this phase matters

Public pages affect:

* trust
* conversion
* product perception
* onboarding of new specialists
* client confidence before booking

### Safety rules

Preserve:

* links
* CTA targets
* public profile slug logic
* booking flow
* tariff truth
* auth redirects
* responsive header behavior

---

## Phase 4 — Specialist Dashboard Polish

### Phase 4 Goal

Make the authenticated workspace feel like a daily working cockpit.

### Target areas

* main cabinet/dashboard
* summary cards
* today sessions
* upcoming sessions
* work queue
* pending tasks
* quick actions
* messages/notifications preview
* onboarding/readiness state

### Should improve

* visibility of important actions
* unpaid/pending states
* upcoming sessions
* client/session context
* daily workflow speed

### Must preserve

* onboarding state endpoint usage
* entitlement logic
* role behavior
* existing dashboard actions
* current data sources

### Risk

High.

Dashboard touches many product areas.

---

## Phase 5 — Core Workflow Pages Polish

### Phase 5 Goal

Improve daily specialist workflows without changing behavior.

### Recommended order

1. Sessions list
2. Session detail
3. Clients list
4. Client detail
5. External sessions
6. External session detail
7. Settings
8. Billing/payment details

### Why this order

These pages directly affect daily product usefulness.

### Must preserve

* session lifecycle
* booking statuses
* payment statuses
* note/workbook flow
* returnTo navigation flow
* client relation logic
* guest invite logic
* payment method logic

---

## Phase 6 — External Sessions Guest Invite Safety UX

### Phase 6 Goal

Prevent specialists from sending raw meeting URLs directly to guests.

### Scope

Main page:

```text
/cabinet/external-sessions/:id
```

Main principle:

> Guest invite link must be the primary sharing path.

### Requirements

* raw meeting URL should not look like a guest-share link
* near meeting URL, show explanation that it is internal
* near meeting URL, show CTA to create/copy guest invite
* existing “Гостьовий доступ” section should remain
* if invite exists, label it “Посилання для гостя”
* if no invite exists, show attention state
* no backend changes unless data is missing

### Risk

High.

This is a security/flow clarity issue, not just visual polish.

### Tests should cover

* online external session with meeting URL and no invite
* existing invite visible as guest link
* raw meeting URL not labeled as shareable
* CTA creates or copies invite depending on state

---

## Phase 7 — Mobile Visual QA

### Phase 7 Goal

Ensure the new design does not break small screens.

### Required viewport checks

* 360px
* 390px
* 430px
* 768px
* desktop

### Check every migrated page for

* no horizontal overflow
* visible primary CTA
* readable cards
* no clipped text
* no broken header/sidebar
* no blocked forms
* no hidden important warnings
* usable modals
* usable tables or mobile alternatives

### Important

Decorative elements must be simplified or hidden on mobile if they cause layout issues.

---

## Phase 8 — Final Visual Consistency Pass

### Phase 8 Goal

Remove visual fragmentation after page-by-page migration.

### Check consistency of

* buttons
* cards
* badges
* headings
* section spacing
* forms
* tables
* empty states
* attention states
* footer/header
* dashboard panels
* mobile behavior

### Done when

The product feels like one coherent system, not a collection of unrelated pages.

---

## 8. Near-Term Execution Plan

Recommended next practical sequence:

### Step 1

Audit current frontend style structure.

Find:

* global CSS files
* layout components
* button styles
* card styles
* badge styles
* existing CSS variables
* existing component patterns

### Step 2

Add or align visual tokens.

Do this carefully and additively.

Do not break current UI.

### Step 3

Polish Home page.

Reason:

* public-facing
* high visual impact
* relatively lower business risk than workspace pages

### Step 4

Polish Pricing/Tariff presentation.

Reason:

* high conversion impact
* must reflect correct product pricing

### Step 5

Polish Public Specialist Profile.

Reason:

* directly affects client trust and booking conversion

### Step 6

Polish Specialist Dashboard.

Reason:

* directly affects daily product usefulness for specialists

### Step 7

Polish workflow pages gradually.

Start with:

* Sessions
* Clients
* External sessions

---

## 9. Page-Level Migration Template

Use this template before starting each page migration.

```md
# Page Migration Task — [Page Name]

## Page

Route:

Files:

## Current behavior to preserve

- 
- 
- 

## Visual goals

- 
- 
- 

## Allowed changes

- spacing
- layout grouping
- cards
- typography
- colors
- badges
- responsive improvements

## Forbidden changes

- routes
- API calls
- business logic
- permission logic
- tests removal
- mock data introduction

## Data states to preserve

- loading
- error
- empty
- success
- permission denied
- disabled state
- mobile state

## Smoke checks

- page opens
- main CTA works
- route still works
- API calls unchanged
- mobile has no overflow
- tests pass
- build passes
```

---

## 10. Smoke Check Template

Use after each migrated page.

```md
# Smoke Check — [Page Name]

## Route checked

- 

## Desktop

- [ ] page opens
- [ ] no console errors
- [ ] main content visible
- [ ] main CTA works
- [ ] loading state works
- [ ] empty/error state preserved where applicable

## Mobile

- [ ] checked at 360px
- [ ] checked at 390px
- [ ] checked at 430px
- [ ] no horizontal overflow
- [ ] primary CTA visible
- [ ] cards stack correctly
- [ ] text not clipped

## Product safety

- [ ] no route changed
- [ ] no API contract changed
- [ ] no business logic changed
- [ ] no mock data added
- [ ] no role-specific behavior removed
- [ ] no approved Ukrainian copy accidentally replaced

## Tests/build

- [ ] relevant tests pass
- [ ] build passes
```

---

## 11. Task Size Rule

Each visual migration task should be small.

Preferred task size:

* one page
* or one shared component
* or one section of a complex page

Avoid tasks like:

* “redesign all cabinet pages”
* “make the whole site like the mockup”
* “replace all styles globally”
* “clean all CSS”
* “rebuild dashboard and sessions together”

Better tasks:

* “Polish Home hero and feature cards”
* “Create reusable pricing card component”
* “Polish public specialist profile hero”
* “Improve session status badges”
* “Polish external session guest invite block”

---

## 12. High-Risk Areas

Be extra careful with these areas.

### Booking flow

Risk:

* broken client conversion
* wrong slot states
* wrong redirects

### Session lifecycle

Risk:

* wrong status transitions
* broken completion flow
* broken notes/workbook flow

### Payments

Risk:

* wrong payment status
* wrong recipient instructions
* broken payment proof flow
* incorrect tariff/business logic

### Guest sessions

Risk:

* guest receives wrong link
* meeting URL exposed as primary share link
* invite flow becomes unclear

### Admin pages

Risk:

* admin access logic broken
* role guard changes
* pure admin behavior broken

### Auth pages

Risk:

* login/register redirect bugs
* validation errors hidden
* mobile form issues

---

## 13. Current Priority Recommendation

Current recommended priority:

1. Keep external sessions UX task paused until ready
2. Finish design planning documents
3. Audit current CSS/components
4. Start with public Home visual polish
5. Then Pricing visual polish
6. Then Public Specialist Profile visual polish
7. Then Specialist Dashboard polish
8. Then return to External Sessions UX safety fix
9. Then Sessions/Clients workflow polish

Reason:

The project already has many working pages. The safest path is to establish visual foundations first, then migrate by page.

---

## 14. Design Asset Strategy

Do not depend on many large images.

Prefer:

* CSS shapes
* inline SVG
* reusable decorative components
* icon library
* optimized SVGs

Generate separate assets only when needed:

* logo pack
* favicon
* OG image
* hero/dashboard mockup
* specialist placeholder portraits
* decorative SVG shapes

Do not block page migration on perfect assets.

First priority is a clean, consistent UI system.

---

## 15. Definition of Done for UI Migration

A page migration is done when:

* visual style is closer to the target design
* existing functionality is preserved
* mobile layout is checked
* loading/error/empty states are preserved
* Ukrainian terminology is consistent
* tests pass
* build passes
* no mock data or mock pricing was introduced
* no route/API/business logic was changed accidentally

---

## 16. Final Rule

The redesign must make PRO CONSULT feel more professional without making the product less reliable.

The correct migration outcome is:

> Same working product, stronger visual system, clearer hierarchy, better trust, better daily usability.

## 17. Current Frontend Style Audit

### Audit date

2026-04-24

### Summary

The frontend currently has one global stylesheet:

```text
src/style.css
````

Most Vue pages and components also contain local scoped styles:

```text
src/**/*.vue <style scoped>
```

The backend does not currently contain project-owned HTML/CSS that affects the main website UI.

### Global style state

`src/style.css` already contains a basic design foundation:

* global CSS variables in `:root`
* color tokens
* font tokens
* radius tokens
* shadow tokens
* global body background
* page wrapper styles
* topbar styles
* brand/nav styles
* card styles
* badge styles
* input styles
* button styles
* basic hero/scene styles

This means the project already has a partial design system.

The new visual direction should not replace this file from scratch.

### Important migration conclusion

Do not rewrite `src/style.css`.

Instead:

1. add new PRO CONSULT target tokens additively, preferably using `--pc-*` variables
2. keep old variables for compatibility
3. gradually map old variables to new variables only when safe
4. migrate pages/components one by one
5. avoid broad global changes that may unexpectedly affect many scoped pages

### Current risk

Because almost every `.vue` page/component has its own `<style scoped>` block, visual migration must be page-scoped.

Global changes in `src/style.css` can still affect:

* body background
* `.page`
* `.topbar`
* `.brand`
* `.nav`
* `.card`
* `.badge`
* `.input`
* `.btn`

So any change to these global classes must be treated as medium/high risk.

### Recommended next technical step

Add new design tokens to `src/style.css` without changing existing behavior.

The first safe change should be additive only:

* add `--pc-*` color tokens
* add `--pc-*` spacing tokens
* add `--pc-*` shadow tokens
* add `--pc-*` container tokens
* do not remap existing variables yet
* do not change existing class styles yet

After that, start using the new tokens in one isolated page or component.

### Token addition check

Added additive `--pc-*` design tokens to `src/style.css`.

Build result:

```text
npm run build
✓ built successfully
```

Note:

Vite still shows the existing chunk size warning for the main JS bundle. This is not related to design tokens and is not blocking the UI migration.

---

## 18. Home Visual Migration Log

### 2026-04-24 — Home hero first pass

Changed scope:

* `src/views/HomeView.vue`
* `src/App.vue`
* `src/style.css`

What changed:

* Added additive `--pc-*` target design tokens.
* Added hero eyebrow label on Home.
* Updated Home hero container to use the new PRO CONSULT navy / cream / peach / teal visual direction.
* Updated Home hero title color to `--pc-navy-950`.
* Updated Home hero CTA buttons locally without changing global `.btn`.
* Updated guest topbar/header colors toward the new navy public-page style.

Preserved:

* Home route.
* Authenticated/guest CTA logic.
* Pricing route.
* Signup route.
* Cabinet redirect logic.
* Billing toggle logic.
* Walkthrough content and observers.
* Existing screenshot assets.
* Existing global `.btn` behavior outside Home hero.

Notes:

This is only the first visual pass for the Home hero/header. The full Home page has not been migrated yet.

Remaining Home work:

* Align hero screenshot cards with the new mockup style.
* Improve decorative background shapes.
* Polish value cards.
* Polish walkthrough section.
* Polish pricing teaser.
* Polish FAQ and final CTA.
* Check mobile layout after each section-level change.

### 2026-04-24 — Home hero screenshot cards polish

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated hero screenshot card borders to the new navy-based visual system.
* Updated hero screenshot card backgrounds to a cleaner white/cream style.
* Updated browser-dot accents to teal.
* Updated screenshot card shadows and viewport backgrounds.
* Kept all existing screenshot assets and layout logic.

Preserved:

* Existing image paths.
* Existing hero collage structure.
* Existing responsive behavior.
* Existing CTA logic.
* Existing Home page script logic.

Notes:

Hero area is now partially aligned with the new PRO CONSULT visual direction. Further work should continue section by section.

### 2026-04-24 — Home value cards polish

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated Home value cards to use the new PRO CONSULT visual tokens.
* Added softer card radius, border, shadow, and subtle decorative circles.
* Kept FAQ and pricing cards separated from value card styling to avoid accidental broad visual changes.

Preserved:

* Existing value proposition content.
* Existing Home page layout.
* Existing FAQ card styling.
* Existing pricing teaser card styling.
* Existing script logic.

Notes:

This step intentionally affects only the value cards below the hero.

### 2026-04-24 — Home walkthrough header and chips polish

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated walkthrough section heading typography to match the new PRO CONSULT visual direction.
* Updated walkthrough chips to use pill style, navy active state, softer borders, and lighter card-like background.
* Updated eyebrow color to use `--pc-text-muted`.

Preserved:

* Existing walkthrough anchors.
* Existing active section tracking.
* Existing IntersectionObserver logic.
* Existing walkthrough content.
* Existing screenshot assets.
* Existing responsive structure.

Notes:

This step intentionally affects only the walkthrough section header and navigation chips. The walkthrough feature blocks themselves are not migrated yet.

### 2026-04-24 — Home walkthrough feature cards first pass

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated walkthrough feature blocks to use the new PRO CONSULT card style.
* Added softer border, radius, shadow, and cream/navy/teal background treatment.
* Reduced excessive width by limiting feature cards to `1180px`.
* Reduced spacing between walkthrough feature cards.
* Updated walkthrough feature title typography.

Preserved:

* Existing walkthrough section order.
* Existing anchors and chip navigation.
* Existing active section tracking.
* Existing IntersectionObserver logic.
* Existing image paths.
* Existing responsive structure.
* Existing script logic.

Notes:

This is a first pass for the large walkthrough feature cards. Further polish may include product-shot top bars, text spacing, and mobile layout checks.

### 2026-04-24 — Home walkthrough product-shot polish

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated product-shot top bars to the new PRO CONSULT visual system.
* Replaced old green-tinted borders with softer `--pc-border`.
* Updated browser dots to teal.
* Updated viewport backgrounds with subtle teal/peach accents.
* Improved visual consistency between hero screenshots and walkthrough screenshots.

Preserved:

* Existing product screenshot assets.
* Existing walkthrough card layout.
* Existing anchors and chip behavior.
* Existing script logic.
* Existing responsive structure.

Notes:

Walkthrough feature blocks now visually align better with the new Home hero direction.

### 2026-04-24 — Home final CTA polish

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated final CTA to use the new PRO CONSULT navy / cream / teal / peach visual direction.
* Added softer radius, border, shadow, and background accents.
* Updated final CTA heading typography.
* Updated final CTA buttons locally without changing global `.btn`.

Preserved:

* Existing CTA copy.
* Existing signup route.
* Existing pricing route.
* Existing authenticated cabinet redirect logic.
* Existing script logic.

Notes:

Final CTA is now visually aligned with the first Home migration pass. Footer remains a separate future task.

### 2026-04-24 — Home FAQ cards polish

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Updated FAQ cards to use the new PRO CONSULT card style.
* Separated FAQ card styling from pricing card styling.
* Updated FAQ title typography to use navy color.
* Preserved pricing card overrides.

Preserved:

* Existing FAQ copy.
* Existing FAQ section layout.
* Existing pricing teaser styles.
* Existing script logic.

Notes:

FAQ cards are now visually aligned with the Home first-pass redesign.

### 2026-04-24 — Home footer first pass

Changed scope:

* `src/App.vue`
* `src/views/HomeView.vue`

What changed:

* Updated Home-only footer to use the new navy PRO CONSULT visual direction.
* Kept footer changes scoped to `body.body--home`.
* Updated footer link colors for dark background.
* Reduced excessive bottom spacing between final CTA and footer.

Preserved:

* Existing footer template.
* Existing footer legal links.
* Existing FAQ link.
* Existing staging deploy marker behavior.
* Existing shell behavior for non-Home pages.
* Existing Home content and CTA logic.

Notes:

This is a first visual pass for the Home footer. Full footer restructuring into multi-column marketing footer is intentionally deferred.

### 2026-04-24 — Home walkthrough tariff accent cleanup

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Replaced old green tariff/access accent in walkthrough feature cards.
* Updated access line styling to use the new PRO CONSULT accent token.
* Improved visual consistency with the navy/teal Home redesign.

Preserved:

* Existing tariff/access text.
* Existing walkthrough content.
* Existing anchors and chip behavior.
* Existing script logic.

Notes:

This removes another visible remnant of the old green visual system from the Home walkthrough section.

### 2026-04-24 — Home tablet/mobile spacing correction

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Added tablet-specific top spacing for Home to prevent hero eyebrow from being clipped around 768px.
* Kept mobile Home top spacing compact for phones.
* Verified Home hero on iPad Mini / 768px and phone-width viewport.

Preserved:

* Existing mobile hero layout.
* Existing desktop layout.
* Existing CTA logic.
* Existing screenshot behavior.
* Existing script logic.

Notes:

Tablet and phone layouts require different top spacing because the Home header behavior differs across breakpoints.

### 2026-04-24 — Home pricing secondary CTA alignment

Changed scope:

* `src/views/HomeView.vue`

What changed:

* Centered the secondary pricing CTA under the pricing cards.
* Removed old yellow/green hover behavior from the “Потрібні інші умови?” button.
* Updated the button to use the new navy/teal secondary CTA style.

Preserved:

* Existing support/data request route.
* Existing pricing card logic.
* Existing billing toggle.
* Existing tariff copy.
* Existing script logic.

Notes:

The pricing secondary CTA now visually belongs to the pricing section instead of looking like a stray button.

### Home future polish backlog

The Home page first-pass visual migration is complete, but it is not the final 1:1 target design.

Future Home polish should include:

* Add visual icons to the value cards.
* Add or refine decorative shapes and dotted patterns.
* Improve the footer toward a richer multi-column marketing footer.
* Refine typography and spacing against the final visual reference.
* Consider a stronger SaaS-style hero dashboard mockup composition.
* Review whether current screenshot assets should be replaced, cropped, or recomposed.
* Generate or add lightweight SVG assets where CSS is not enough.
* Run final visual QA across desktop, tablet, and mobile.

Current status:

* Home first-pass is good enough to move to the next public/conversion page.
* Do not treat Home as final.
* Return to Home after at least one more key public page is aligned with the new visual system.

---

## 19. External Sessions UX Safety Log

### 2026-04-24 — Guest invite primary sharing path

Changed scope:

* `src/views/ExternalSessionDetailView.vue`
* `src/views/ExternalSessionDetailView.spec.ts`

What changed:

* Added clear explanation near the online meeting URL that it is an internal meeting link and should not be sent directly to the guest.
* Added attention state when an online external session has a meeting URL but no guest invite yet.
* Added primary CTA near session parameters to create a guest invitation when no invite exists.
* Added action near session parameters to copy the guest invitation when invite already exists.
* Updated the guest access section to label the guest URL as `Посилання для гостя`.
* Kept offline sessions free from online-specific warning copy.
* Preserved the existing guest invite section.

Preserved:

* Existing external session route.
* Existing guest invite business logic.
* Existing meeting URL handling.
* Existing offline session behavior.
* Existing guest access section.
* Existing backend contracts.
* Existing sharing/copy behavior.
* Existing tests, extended where needed.

Verification:

```bash
npm run test:run -- src/views/ExternalSessionDetailView.spec.ts
npm run typecheck
npm run build
```

---

## 20. Public Profile Visual Migration Log

### 2026-04-25 — Public profile hero first safe pass

Changed scope:

* `src/views/PublicProfileView.vue`
* `src/components/public-profile/PublicProfileHeroSection.vue`
* `src/components/public-profile/PublicProfileIdentityRail.vue`

What changed:

* Updated the public specialist profile top area toward the PRO CONSULT navy / cream / teal / peach visual system.
* Applied `--pc-*` tokens to the hero card, profile media, chips, general info card, and sticky identity/CTA rail.
* Updated the top primary CTA rail locally to use navy primary buttons and white/navy secondary buttons.
* Softened borders, shadows, card backgrounds, and accent badges in the hero/top section only.
* Added a cream public-profile page backdrop around the existing layout.

Preserved:

* Public profile route and slug handling.
* Existing API calls and profile visibility branches.
* Booking, inquiry, available slot, client session, journal, media, reviews, FAQ, and final CTA logic.
* Existing hero props, emitted events, labels, and conditional rendering.
* Existing lower public profile sections for future migration phases.

Verification:

```bash
npm run test:run -- src/views/PublicProfileView.spec.ts src/components/public-profile/PublicProfileTrustSection.spec.ts
npm run typecheck
npm run build
```

Notes:

This is a first safe visual pass for the public profile hero/top section only. Remaining future polish should migrate lower profile panels, slots, inquiry, reviews, media, journal preview, FAQ, and final CTA in separate scoped passes.

---

## 21. Specialist Dashboard Visual Migration Log

### 2026-04-25 — Dashboard top and summary first safe pass

Changed scope:

* `src/views/CabinetView.vue`

What changed:

* Updated the specialist dashboard shell backdrop and hero/header card toward the PRO CONSULT navy / cream / teal / peach visual system.
* Applied local `--pc-*` token styling to the dashboard hero, live-session status card, work queue panel, summary metric cards, action hub panel, and quick action tiles.
* Softened borders, shadows, card backgrounds, and dashboard title hierarchy in the migrated top area.
* Kept the migrated styling local to the dashboard top/summary blocks.

Preserved:

* Existing dashboard API calls and data normalization.
* Existing onboarding/readiness logic.
* Existing entitlement/access and Start limit fallback logic.
* Existing work queue business rules and preview branches.
* Existing session/client/payment state handling.
* Existing routes and RouterLink targets.
* Existing loading, error, empty, warning, and retry states.

Verification:

```bash
npm run test:run -- src/views/CabinetView.spec.ts
npm run typecheck
npm run build
```

Notes:

This is not a full dashboard redesign. Remaining future polish should migrate the detailed work queue cards, nearest session internals, plan/access panel, onboarding panel, loading/error states, and mobile density in separate scoped passes.

### 2026-04-24 — Public profile hero layout clipping fix

Changed scope:

* `src/components/public-profile/PublicProfileHeroSection.vue`

What changed:

* Fixed specialist name clipping around 1180px viewport.
* Moved general information below the main hero row on widths up to 1280px.
* Made the photo column more compact on small desktop/tablet.
* Allowed specialist name to wrap naturally instead of being clipped.
* Preserved mobile stacked layout.

Verification:

```bash
npm run test:run -- src/views/PublicProfileView.spec.ts src/components/public-profile/PublicProfileTrustSection.spec.ts
npm run typecheck
npm run build
```

---

## 22. Sessions Page Visual Migration Log

### 2026-04-25 - Specialist sessions first safe visual pass

Changed scope:

* `src/views/TherapistSessionsView.vue`
* `docs/UI_MIGRATION_PLAN.md`

What changed:

* Updated the specialist sessions page shell, hero, panels, filters, priority cards, session cards, request cards, history tiles, and local status badge styling toward the PRO CONSULT visual system.
* Applied local `--pc-*` token styling for navy headings, cream/white panels, soft borders, teal/peach accents, and softer shadows.
* Kept changes scoped to the sessions page visual layer.

Preserved:

* Existing `/cabinet/sessions` route behavior.
* Existing API calls for upcoming/history sessions, slots, reschedule requests, suggestions, profile photo, notes, and workbook snapshots.
* Existing upcoming/history filtering and status grouping.
* Existing session lifecycle actions: confirm, join, complete, cancel, reschedule, recurring series.
* Existing payment badge logic and payment badge classes.
* Existing loading, error, empty, request, inline panel, completion modal, note modal, workbook, and `returnTo` flows.

Verification:

```bash
npm run test:run -- src/views/TherapistSessionsView.spec.ts
npm run test:run -- src/views/SpecialistSessionsFlow.spec.ts
npm run typecheck
npm run build
```

Result:

* `npm run test:run -- src/views/TherapistSessionsView.spec.ts` - passed, 23 tests.
* `npm run test:run -- src/views/SpecialistSessionsFlow.spec.ts` - passed, 7 tests; existing Vue Router warning for `/cabinet/clients?client=77&autoOpen=1` remains in the test harness.
* `npm run typecheck` - passed.
* `npm run build` - passed; existing Vite chunk-size warning remains.

Deferred items:

* Full note/workbook modal visual migration.
* Session detail page polish.
* Broader shared button/card component extraction.
* Manual browser smoke at 1180px, 768px, and 390-430px.

---

## 23. Manual Client Records FE Phase 1

### 2026-04-25 - Clients page manual record integration

Changed scope:

* `src/views/TherapistClientsView.vue`
* `src/views/TherapistClientsView.spec.ts`
* `docs/UI_MIGRATION_PLAN.md`

What changed:

* Added specialist-created manual client records to the Clients page list.
* Added `Додати клієнта` CTA and create modal using the backend `display_name` contract.
* Integrated manual record archive and restore actions through the cabinet client-record endpoints.
* Added visual distinction between registered clients (`З кабінетом`) and manual clients (`Без кабінету`).
* Included manual active/archived records in the existing status filters and search.
* Added a non-blocking warning when manual records fail to load while registered clients remain visible.

Preserved:

* Existing registered-client API calls and relation behavior.
* Existing registered-client filters, archive/restore, private history, workbook, note, board, and reminder flows.
* Existing route names, session return targets, and client deep-link behavior.
* No manual-client session creation, invite, linking, deduplication, or guest conversion.

Verification:

```bash
npm run test:run -- src/views/TherapistClientsView.spec.ts
npm run typecheck
npm run build
```

Result:

* `npm run test:run -- src/views/TherapistClientsView.spec.ts` - passed, 23 tests.
* `npm run typecheck` - passed.
* `npm run build` - passed; existing Vite chunk-size warning remains.

Deferred items:

* Manual-client edit flow.
* Manual-client session creation, if backend support is added later.
* Invite/link/deduplication flows.
* Manual browser smoke at desktop, 1180px, 768px, and 390-430px.
