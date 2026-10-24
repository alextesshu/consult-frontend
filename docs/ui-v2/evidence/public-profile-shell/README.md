# UI v2 public specialist profile — header and footer consistency

**Defect:** after PR #68 the `/s/:slug` profile showed the fennec, but its chrome stayed legacy:
- signed-in visitors saw the legacy gradient full-width header;
- every visitor saw the legacy compact footer outside the page container.

Base: `origin/dev` 6f91363 (includes #65 Dashboard, #66 Cabinet Shell, #67 Schedule overflow, #68 Public branding). Branch `fix/ui-v2-public-profile-shell`.

Design source: `claude-design-2026-10-23-4ff7cedd`, `Specialist-Profile.dc.html` and `Specialist-Profile-Mobile.dc.html`.

## Decisions (confirmed by the user before implementation)

- **Promotion restrictions stay.** The snapshot shows audience tabs and «Знайти спеціаліста» in the profile header. The existing specialist-owned product rule (no catalog, pricing, registration or product promotion on a specialist's page) takes precedence. Header and footer keep the legal-only and login/account content.
- **Scope is every specialist-owned surface:**
  - `/s/:slug` and its aliases `/t/`, `/specialist/`;
  - the specialist's blog pages;
  - `/s/:slug/feedback`;
  - `/public`.

## Change

| File | Change |
|---|---|
| `src/App.vue` | See the breakdown below. |
| `src/styles/components-v2.css` | `.pc2-public-auth-header` styles: cream background, hairline border, sticky, 76px (60px under 768px), the 1240px container and gutter, 32px lockup (30px on phones). Account controls get the existing v2 tokens: outlined navy cabinet pill, quiet links, 40/44px round icon buttons, outlined «Вийти», v2 dropdown cards, visible focus ring. |
| `src/__tests__/app.spec.ts` | One mobile test updated (the duplicate menu is gone). New `UI v2 specialist-owned public shell` tests cover guest and signed-in roles, every owned route, footer links, privacy controls, menu and Escape. Boundary tests cover neutral pages, the cabinet shell and v1. |

`src/App.vue` changes:
- **Signed-in header.** New `useSignedInPublicHeaderV2` (v2, signed in, specialist-owned) adds `pc2-public-auth-header` to the header and `shell--public-auth-header-v2` to the shell.
  - Which account actions render is unchanged: cabinet, materials/public profile, chat, settings, notifications, menu, logout.
- **Footer.** `usePublicFooterV2` now covers specialist-owned pages.
  - On those pages the `pc2-footer` hides FAQ, Disclaimer and the product row.
  - It shows the snapshot disclaimer: «Інформацію на сторінці надає спеціаліст. Pro Consult не перевіряє кваліфікацію і не бере комісію з консультацій.»
  - The now v1-only legacy owned-footer image loses its v2 branch.
- **Guest menu.** The guest «Меню сайту» toggle and inline menu are not rendered on specialist-owned pages.
  - Their only item was a duplicate of the visible login action. The mobile snapshot also has no menu.

Unchanged: UI v1 and the default UI version, Cabinet Shell, profile content and booking, router, API, auth store, KAN-159 registration, Specialist Inquiries, SVG assets, build configuration.

## Chromium acceptance (`acceptance.cjs` → `acceptance.json`): 42 matrix rows, 12 interactions, 0 problems

The matrix runs on `/s/olena` with browser fixtures only (the KAN-158 profile fixture plus fake auth).
- **Widths:** 375 / 390 / 640 / 768 / 1024 / 1280 / 1440.
- **Roles:** guest / specialist / client.
- **UI versions:** v1 / v2.

Every row checks:
- no horizontal overflow;
- no page errors;
- no catalog, pricing, registration or FAQ links in the header or footer.

UI v1 rows: header and footer controls, classes and lockup are identical to `origin/dev`.

UI v2 rows:
- **Header:**
  - guest: `pc2-header`; signed-in: `pc2-public-auth-header`;
  - sticky, 76px (60px under 768px);
  - fennec header lockup 32px (30px on phones).
- **Login and account actions:**
  - guest login is visible;
  - the cabinet entry is visible (`/cabinet` for a specialist, `/client` for a client);
  - notifications are visible;
  - logout is visible on desktop, the menu on phones.
- **Footer:**
  - `pc2-footer footer--specialist-owned` with the fennec lockup;
  - privacy, terms and support links plus the privacy-settings control;
  - the disclaimer.

Interactions (v2):
- **Signed-in mobile menu at 375 (client, specialist):** opens; Escape closes it and returns focus to «Меню».
- **Specialist at 1440, menus:**
  - the settings menu and the notifications panel open and close with Escape.
- **Specialist at 1440, keyboard:** Tab order from a fresh load is logo → «Мій кабінет» → «Публічний профіль» → chat → settings → notifications → «Вийти». Every stop shows a focus ring.
- **Guest login action** navigates to `/login` (375, 1024).
- **Footer «Налаштування конфіденційності»** opens the consent region (guest, client).
- **Sticky behaviour:** the header stays at the top and the profile tabs stick below it (client 1440 and 375, guest 1440).

## Before / after screenshots (`screenshots/`)

- `before-*` = `origin/dev`, `after-*` = this branch, UI v2.
- Each capture: `<before|after>-v2-<role>-<375|768|1440>-<header|footer>.png`.
  - Footer captures are the viewport scrolled to the end, as a visitor sees them; on phones that includes the profile's fixed booking bar.
- Interaction captures:
  - `after-v2-<client|specialist>-375-mobile-menu.png`;
  - `after-v2-specialist-1440-settings.png`;
  - `after-v2-specialist-1440-notifications.png`.

## Other public pages unchanged (UI v2)

Pages: Home, For Clients, Specialists and FAQ. Roles: guest and client. Widths: 375 and 1440.

- Full-page captures of `origin/dev` and this branch: **16/16 pixel-identical** (`parity.json` → `v2-other`).

## UI v1 pixel parity (`parity.cjs`, `compare.py` → `parity.json`)

Setup:
- 60 full-page pairs against `origin/dev`, with a second baseline capture as noise control.
  - Guest: Home, For Clients, Specialists, FAQ, `/s/olena`, `/s/olena/journal`.
  - Specialist: Home, Specialists, `/s/olena`, journal, `/cabinet`.
  - Client: Home, Specialists, `/s/olena`, journal.
  - Widths: 375, 768, 1280 and 1440.
- Both servers are warmed first.
- Every capture waits for the page heading, `document.fonts.ready`, network idle, disabled and finished animations, revealed sections and a stable document height. There is no fixed delay after a cold start.

**Result: 54/60 exact on the first run, no regression.** The six other pairs were re-captured 3× per build:

| Pair | First run | Re-capture (3 × 3 cross pairs) | Classification |
|---|---|---|---|
| 375 guest `/for-clients` | 118 293 px | 2/9 cross pairs exact; baseline-vs-baseline differs by the same 117–118k px | capture instability |
| 1280 guest `/for-clients` | 205 705 px, max Δ 1/255 | 3/9 cross pairs exact; baseline noise 95–206k px | capture instability |
| 1440 guest `/for-clients` | 372 942 px, max Δ 2/255 | 4/9 cross pairs exact; baseline noise 248k px | capture instability |
| 1440 guest `/specialists` | 35 px, max Δ 2/255 | 6/9 cross pairs exact; baseline noise 35 px | capture instability |
| 1440 guest `/s/olena/journal` | 1 091 px | 9/9 cross pairs exact | capture instability |
| 1440 client `/s/olena/journal` | 34 px, max Δ 2/255 | 9/9 cross pairs exact | capture instability |

Notes on the re-capture:
- The DOM (build marker excluded) is identical between builds in all six pairs.
- Fonts were loaded, with 0 running animations and the same document height.
- **v1 `/for-clients` restores a scroll offset of 76–90 px.** Its value varies between runs of the same build, so the floating v1 header lands at different positions in full-page captures.
- `/specialists` differs only in background-gradient rasterization.

Full-page PNGs (149 MB) are kept outside the repository, as in previous evidence. `pairs.json` lists them, and `parity.json` holds the results.

## Verification

- **Vitest:**
  - focused (App, styles, uiVersion, PublicProfileView, router, PublicMobileMenuV2): 14 files / 389 tests passed;
  - `app.spec.ts` alone: 110 tests passed;
  - full suite: 128 files / 1965 tests passed.
- **`vue-tsc -b --force`:** 9 errors on both `origin/dev` 6f91363 and this branch. It is the same set:
  - `AdminWorkQueueView.vue`: 3; `AdminWorkQueueView.spec.ts`: 1;
  - `TherapistClientsView.vue`: 2; `TherapistClientsView.spec.ts`: 2;
  - `specialistDiscoveryApi.spec.ts`: 1.
  - 0 new.
- **`vite build`:** OK; only the existing chunk-size warning.
- **`git diff --check`:** OK.

## Known limitations

- **Snapshot vs product rule.** The snapshot's audience tabs and «Знайти спеціаліста» are intentionally not shown on specialist-owned pages (confirmed product rule).
- **Signed-in header design.** The snapshot has no signed-in public header. The signed-in frame reuses the guest public header geometry and the cabinet header's action treatment; the set of actions is unchanged.
- **Mobile booking bar.** On phones the profile's own fixed booking bar overlaps the lowest part of the page at the very end of the scroll. The footer links and the disclaimer stay readable above it; previously the bar covered the legacy footer links. The bar belongs to profile content and is not changed here.
- **Footer artwork.** The footer uses the approved fennec lockup and blue watermark instead of the snapshot's legacy raster logo and sand mark, per the approved brand override.
