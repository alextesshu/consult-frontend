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

Runtime assets are separately named `src/assets/brand-v2/proconsult-fennec-lockup.svg` and `proconsult-fennec-symbol-blue.svg`. Existing public/brand files, favicons, application icons and source snapshots are untouched. SVG is rendered only in guest v2 public chrome; authenticated and minimal shells retain existing presentation.

## Scope / justified reference differences

- App.vue uses the existing reactive UI flag. V1 and authenticated markup/controls retain their legacy branches. No routes/API/stores/permission/registration/Home/Profile/Discovery/Dashboard logic changes.
- Header remains 76px, cream/hairline/Onest, audience navigation and current routes. Primary CTA uses Claude's outlined idle state and navy hover/active; current CTA wording/destination is preserved.
- The final primary PDF is vertically stacked, unlike the old horizontal Claude logo. Preserve its complete approved composition at 56px total header height and 80px footer height, rather than distorting it into a horizontal mark or replacing its typography. The old 40px logo token remains unchanged; public lockup uses that token plus 16px. Footer watermark uses the exact approved blue symbol with decorative opacity, without recoloring/retracing it.
- At 900px and below, a semantic disclosure navigation preserves all working public links. Native button, aria-controls/expanded, Enter/Space/Tab/Shift+Tab, Escape focus return, outside click and route/version-change closure. Existing authenticated mobile menu remains unchanged.
- Compact v2 footer follows the Claude cream/hairline/brand/legal-link arrangement. Extra existing product/registration links, disclaimer and privacy-preference action remain available rather than disappearing. Specialist-owned public pages retain compact legal-only content and promotion restrictions.
- `/for-clients` is deferred to KAN-156: keep working `/#client-entry-title`. Prototype global Blog footer link has no generic current destination; no fabricated route is added. Do not apply future Public Profile/editor/support changes. KAN-160 stays HOLD; pending #54–#57/#59 and backend #63 are untouched. Backend #63's existing CI billing limitation is not resolved by this task.

## Executed validation

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
