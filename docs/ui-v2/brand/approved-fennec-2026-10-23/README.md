# KAN-158 — approved UI v2 public brand implementation

Claude layout snapshot: `claude-design-2026-10-23-7570f1ad`, SHA-256 `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`. Base `8754abc0bcb1519169625b39aea567f503206884` after merged #60. Branch `feat/kan-158-public-brand-v2`.

## Approved brand override / provenance

The user's final `logo.rar` approval supersedes older Claude v5 artwork for UI v2 only. Source: `C:/Users/admin/Desktop/Consult/logo/logo.rar`; 880,700 bytes; SHA-256 `94045433c4069222a3f618293fbb94c030f8b324f1a360de3c654694c13141a2`. Archive entries/links/traversal were checked before temporary extraction. Original archive and PDFs are unchanged; no bundled code was executed.

Exact approved references retained here:

- [Primary lockup](consult-logotype_1_2026-10-23-0115.pdf): original stacked fennec + Pro Consult wordmark; embedded Montserrat-Regular.
- [Symbol](consult-logo_2026-10-23-0015.pdf): original darker variant, source reference only.
- [Blue symbol](consult-logo_2026-10-23-0115-blue.pdf): source for the footer watermark.
- [Source and output hashes / converter](MANIFEST.json).

PyMuPDF vector conversion (`get_svg_image(text_as_path=True)`) keeps source viewBox, all path coordinates, glyph outlines/positions, paint, strokes, transforms and negative space. Only whitespace/version/unused Inkscape layer metadata is removed. No tracing, rounding, simplified geometry, substituted font, raster logo or external font dependency. Outlined Montserrat applies to the supplied wordmark only; UI remains Onest. SVG paths/transforms/paint match the converter's original vector output exactly; PDF→SVG raster MAE at 3× is 0.348/255 lockup and 0.172/255 symbol (renderer antialiasing).

The original stacked footer and blue-symbol assets are unchanged. A separate `src/assets/brand-v2/proconsult-fennec-header.svg` reuses their original vector components horizontally for the header. Runtime assets are separately named `src/assets/brand-v2/proconsult-fennec-lockup.svg` and `proconsult-fennec-symbol-blue.svg`. Existing public/brand files, favicons, application icons and source snapshots are untouched. SVG is rendered only in guest v2 public chrome; authenticated and minimal shells retain existing presentation.

## Scope / justified reference differences

- App.vue uses the existing reactive UI flag. V1 and authenticated markup/controls retain their legacy branches. No routes/API/stores/permission/registration/Home/Profile/Discovery/Dashboard logic changes.
- Header remains 76px, cream/hairline/Onest, audience navigation and current routes. Primary CTA uses Claude's outlined idle state and navy hover/active; current CTA wording/destination is preserved.
- The initial implementation used the full stacked PDF at 56px in the header. The user requested a horizontal correction: unchanged symbol on the left and original outlined wordmark on the right, independently uniformly scaled/positioned. Header asset now renders at 32px on desktop and phones; painted wordmark height is approximately 16px. Desktop audience tabs start 80px after the logo box, following the approved reference spacing. No tiny wordmark remains under the header symbol. Footer retains the original 80px stacked lockup and exact blue decorative symbol without recoloring/retracing.
- At 1100px and below, a semantic disclosure navigation preserves all working public links. Native button, aria-controls/expanded, Enter/Space/Tab/Shift+Tab, Escape focus return, outside click and route/version-change closure. Existing authenticated mobile menu remains unchanged.
- Compact v2 footer follows the Claude cream/hairline/brand/legal-link arrangement. Extra existing product/registration links, disclaimer and privacy-preference action remain available rather than disappearing. Specialist-owned public pages retain compact legal-only content and promotion restrictions.
- `/for-clients` is deferred to KAN-156: keep working `/#client-entry-title`. Prototype global Blog footer link has no generic current destination; no fabricated route is added. Do not apply future Public Profile/editor/support changes. KAN-160 stays HOLD; pending #54–#57/#59 and backend #63 are untouched. Backend #63's existing CI billing limitation is not resolved by this task.

## Header spacing correction — current acceptance

The user requested the compact logo and larger separation shown in the supplied header example. Desktop lockup height changes from 40px to 32px, preserving the unchanged SVG geometry. Logo-to-audience-box gap changes from 24px to 80px (existing 24px flex gap plus 56px audience margin). The existing action-group spacing, 76px header, mobile menu/CTA, routes and footer remain unchanged. This is an explicit screenshot-reference spacing approval; source geometry and wordmark are not redesigned.

- Chromium fixture acceptance: 375×677, 768×900, 1280×900, 1440×900 PASS. Header 76px, logo 32px, desktop gap exactly 80px, no overflow. Menu/keyboard focus, CTA, refresh/history retained. Boundary widths 1100/1101/1120 and wide 1920px also pass.
- Focused App/CSS tests **91/91 PASS**; build PASS; typecheck has the exact **9 baseline errors, 0 new**; git diff --check PASS.
- Full-page v1 and isolated v2 footer screenshots are pixel-identical before/after on all four widths. App.vue and all SVG assets remain byte-identical to the pre-spacing commit.
- [Current acceptance evidence](evidence/header-spacing/ACCEPTANCE.json).

| Width | Before spacing correction | After |
| --- | --- | --- |
| 375 | [Before](evidence/header-spacing/before-375.png) | [After](evidence/header-spacing/after-375.png) |
| 768 | [Before](evidence/header-spacing/before-768.png) | [After](evidence/header-spacing/after-768.png) |
| 1280 | [Before](evidence/header-spacing/before-1280.png) | [After](evidence/header-spacing/after-1280.png) |
| 1440 | [Before](evidence/header-spacing/before-1440.png) | [After](evidence/header-spacing/after-1440.png) |

## Horizontal header correction — historical acceptance before spacing update

The user-approved horizontal header composition supersedes the initial stacked-header decision. It uses original blue symbol paths and the primary PDF's exact Montserrat glyph outlines/positions. Nested outer viewports provide uniform scale/translation; no component path, stroke, color or negative space is redrawn. The stacked footer SVG remains byte-identical.

On phones the inline duplicate login link is hidden; the same existing /login action remains available in the accessible mobile menu. The disclosure breakpoint is 1100px to accommodate the wider logo. No route, CTA destination/wording, footer behavior or v1 style changed.

- App/CSS focused tests: **90/90 PASS**, including unchanged source path/glyph comparisons and distinct header/footer assets.
- Build: **PASS**, existing chunk warning only. Typecheck: **9 unchanged baseline errors, 0 new**.
- Chromium fixture checks: **375×677, 768×900, 1280×900, 1440×900 PASS**; header remains 76px, wordmark is horizontal/readable, no overflow, CTA/menu/focus/refresh/history retained.
- V1 full-page screenshots and v2 footer element screenshots are **pixel-identical** before/after on all four widths. Legacy reveal transitions are settled before v1 comparison; footer capture excludes sticky-header occlusion.
- [Correction evidence](evidence/header-correction/ACCEPTANCE.json).

| Width | Before | After |
| --- | --- | --- |
| 375 | [Before](evidence/header-correction/before-375.png) | [After](evidence/header-correction/after-375.png) |
| 768 | [Before](evidence/header-correction/before-768.png) | [After](evidence/header-correction/after-768.png) |
| 1280 | [Before](evidence/header-correction/before-1280.png) | [After](evidence/header-correction/after-1280.png) |
| 1440 | [Before](evidence/header-correction/before-1440.png) | [After](evidence/header-correction/after-1440.png) |

## Initial implementation validation (before the header correction)

- Focused Vitest: **115/115 PASS**, four files: App, UI v2 CSS, uiVersion and bootstrap. Includes v2 disclosure/footer/legacy restoration, role/minimal/specialist-owned boundaries and well-formed self-contained SVG checks.
- `npm run typecheck -- --force`: **9 existing baseline diagnostics, 0 new**, independently reproduced at the exact 8754abc baseline. Existing diagnostics are in specialistDiscoveryApi.spec.ts, AdminWorkQueueView.spec.ts/vue and TherapistClientsView.spec.ts/vue. No unrelated debt fixed.
- `npm run build`: **PASS**; existing >500kB chunk warning retained. No package/lock/build-config changes.
- Local Playwright/Chromium fixtures: **375×677, 768×900, 1280×900, 1440×900 PASS**. Header 76px; lockup 56px and loaded; no horizontal overflow; cream backgrounds, no legacy header/footer shadows; expected public/legal targets; mobile keyboard/focus/menu closure; navigation/history/refresh/version persistence; zero page errors in matrix.
- Additional browser checks: fresh default v1; login/signup destinations; SPA Back/Forward; Space/Shift+Tab/Escape and reduced motion; existing consent action; specialist-owned and minimal shells; CLIENT/SPECIALIST/ADMIN/mixed-role authenticated mobile chrome with fixtures. External font failure at 375/1440 keeps the vector lockup and 76px header; intermediate widths 900/901/920/960/1024/1100 have no wrap/overflow.
- Full-page v1 screenshot comparison with the exact baseline at all four widths: **pixel-identical**, equal dimensions, zero differing pixels. V1 remains default; no global asset replacements.
- [Machine-readable browser/parity/vector evidence](evidence/ACCEPTANCE.json), [desktop header](evidence/v2-1440-header.png), [desktop footer](evidence/v2-1440-footer.png), [mobile header](evidence/v2-375-header.png), [mobile footer](evidence/v2-375-footer.png).
- `git diff --check`, source/archive/output hashes, credential scan, exact changed-file scope and pre-commit cached diff checks performed before Git finalization.

Public preview was fixture-based at `http://127.0.0.1:5298`; exact baseline at 5299, both bound to loopback. API calls were intercepted; no live signup/login/session/payment workflow, production/staging operation or real customer data was exercised. PDF geometry/color verification is separate from browser typography/layout acceptance. UI v1 fallback stays available through `?ui=v1`.

No merge, deployment, Jira update, default-v2 activation or modifications to existing pending PR branches. One focused commit and one Draft PR to dev only.
