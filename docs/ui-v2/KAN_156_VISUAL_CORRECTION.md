# KAN-156 — visual fidelity correction for Draft PR #62

## Source and cause

Reviewed starting HEAD: `2f89a96c5b1cd520dda903d8525231407391c79d`; dev baseline unchanged at `d47bae52562f13a80cb5118bd68823b3bf1a5abf`. Existing branch/worktree and Draft #62 are retained.

Authoritative snapshot: `claude-design-2026-10-23-7570f1ad`; original archive SHA-256 `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`. Reference: [For-Clients.dc.html](snapshots/2026-10-23-7570f1ad/handoff/mockups/For-Clients.dc.html), [matrix](IMPLEMENTATION_MATRIX_V5.md), [sync safeguards](DESIGN_SYNC_2026-10-23_V5.md).

The original implementation replaced the approved specialist-preview cards with explanatory cards. That substantially changed composition without approval. This correction restores the approved structure rather than proposing another design.

Source comparison also found a 1200px legacy main cap and a duplicated 24px shell gutter on each side, narrowing the hero at mobile/tablet sizes. A page-specific v2 main modifier compensates the shell gutter and uses the source 1240px maximum. Header/footer dimensions, markup, assets and behavior remain unchanged.

## Corrected presentation and safety

- Mint split hero with the source auto-fit 400px columns, padding/gap, 32px radius, 38–64px title scale/line-height/tracking; stacked at the actual available width.
- Three specialist-preview cards: 52px initial avatars, name/professional description, topic badges and separate availability column. Source 20px card radius and 16×18px padding restored; availability becomes a row below the details below 640px.
- Names, descriptions and topic pairs are **exactly the first example set already supplied by Claude**, with no additional professionals, qualifications or times. A visible heading and explanatory paragraph identify these as illustrative prototype examples, not real profiles or live search results. Cards are articles without navigation or booking controls. All three use initials instead of the source photo.
- Availability labels use neutral `Час зустрічі / Узгоджується / Формат · приклад`; no nearest-time claim, calendar date or appointment time is published.
- Search has the source 60px field/44px button composition, static source example placeholder, spacing and chip proportions. Existing query validation/routes/group mappings are unchanged. An exact typed topic highlights its link; no default active filter is invented and no live matching/debounce is added.
- The search label/hint remain accessible, visually hidden to preserve source composition. Errors remain visible. The FAQ, three-step copy, optional client CTA, privacy/crisis safeguards, metadata and routes are unchanged.
- Source geometry is local to this page; shared tokens remain byte-identical. Colors still use approved tokens and accessible tint inks. The shared fennec header/footer and default v1 are preserved.

## Source versus implementation captures

All comparisons use the same Chromium and viewport width. Full-page before captures are from the verified original feature HEAD. After captures use the corrected implementation at the requested viewport heights. Hero-only crops use a taller capture viewport at the **same width** to keep the sticky header from covering the tall mobile hero; they are geometry comparisons, not additional responsive acceptance sizes.

The reference is rendered from the frozen original HTML/template/styles and parsed first-example constant data, with loops/conditions resolved statically. **No support.js, brand-listen.js, prototype event handlers or application logic executes.** Source animations are frozen visible; Onest is loaded. Approved fennec artwork replaces old header/footer artwork for the reference capture only. Raw prototype copy and fake slots in these reference images are design evidence, not production claims or backend proof. Reference header has its own mobile limitations; acceptance uses the unchanged approved shared application shell.

| Width | Claude full reference | Before implementation | After implementation | Hero comparison |
| --- | --- | --- | --- | --- |
| 375 | [reference](evidence/kan-156/correction/claude-reference-375.png) | [before](evidence/kan-156/correction/before-375.png) | [after](evidence/kan-156/correction/after-375.png) | [Claude](evidence/kan-156/correction/claude-hero-375.png) / [implementation](evidence/kan-156/correction/implementation-hero-375.png) |
| 768 | [reference](evidence/kan-156/correction/claude-reference-768.png) | [before](evidence/kan-156/correction/before-768.png) | [after](evidence/kan-156/correction/after-768.png) | [Claude](evidence/kan-156/correction/claude-hero-768.png) / [implementation](evidence/kan-156/correction/implementation-hero-768.png) |
| 1280 | [reference](evidence/kan-156/correction/claude-reference-1280.png) | [before](evidence/kan-156/correction/before-1280.png) | [after](evidence/kan-156/correction/after-1280.png) | [Claude](evidence/kan-156/correction/claude-hero-1280.png) / [implementation](evidence/kan-156/correction/implementation-hero-1280.png) |
| 1440 | [reference](evidence/kan-156/correction/claude-reference-1440.png) | [before](evidence/kan-156/correction/before-1440.png) | [after](evidence/kan-156/correction/after-1440.png) | [Claude](evidence/kan-156/correction/claude-hero-1440.png) / [implementation](evidence/kan-156/correction/implementation-hero-1440.png) |

## Validation

Final focused command is the same eight-file matrix in [the implementation report](KAN_156_FOR_CLIENTS.md#local-validation). Updated tests assert all three illustrated identities, six topic badges, neutral availability, absence of profile/booking controls, exact typed-chip styling, mobile availability row, responsive isolation and the v2-only main modifier.

Browser acceptance: 375×677, 768×900, 1280×900, 1440×900 plus 1099/1100/1101×900; API calls use HTTP 401 fixtures, not real backend integration. [Results](evidence/kan-156/correction/browser-results.json) cover computed v2 styles, one header/footer, no overflow/page errors, FAQ pointer/Enter/Space/Tab/Shift+Tab/focus, header selected/menu/Escape behavior, search validation/query handoff, refresh, Back/Forward and client signup navigation. Font failure at 375 remains renderable. [V1 parity](evidence/kan-156/correction/v1-parity.json) records exact-base full-page image hashes and zero changed pixels at the four primary widths.

Final focused matrix: **209/209 PASS across 8 files**, exit 0. Production build **PASS**, exit 0 (existing >500 kB advisory). Typecheck reproduces **exactly the same nine baseline diagnostics, zero new**. `git diff --check` and UTF-8/reference/credential-pattern checks PASS. Automatic CI is recorded separately in the updated Draft PR after GitHub reports its result. Existing nine TypeScript diagnostics remain unrelated baseline debt; no fixes are included. No workflow is manually dispatched or rerun.

## Deliberate remaining differences

The corrected layout preserves the reference card structure and grouping. It is not claimed pixel-identical to the prototype: visible illustration disclosures, safe copy, neutral times, initial avatar instead of photo, keyboard-safe native controls, static placeholder, existing all-specialists secondary link, readable ink colors and tokenized shadows remain. These are explicit contract/accessibility adaptations; there is no independently substituted hero component. No live specialist result/availability API was added.

The existing shared header/footer follows the approved KAN-158 implementation rather than the old prototype chrome. Other section content and safe crisis/support/privacy wording are retained. V1 remains default, unchanged; HomeView and all approved SVG geometry are unchanged. #54–#57/#59/#63 remain untouched; KAN-160 HOLD and backend #63 rollout/billing constraints remain.

## Future implementation rule

Claude Design is authoritative for approved visual composition. Unsupported dynamics must preserve a safely labelled static presentation where possible. Document unresolved design/contract conflicts rather than substituting key components. Substantial composition changes require explicit user approval. This rule is also recorded in the [canonical checklist](DESIGN_SYNC_CHECKLIST.md).


## Exact correction file inventory

32 files (5 source/tests, 3 Markdown documents, 24 screenshot/result artifacts):

```text
docs/ui-v2/DESIGN_SYNC_CHECKLIST.md
docs/ui-v2/KAN_156_FOR_CLIENTS.md
docs/ui-v2/KAN_156_VISUAL_CORRECTION.md
docs/ui-v2/evidence/kan-156/correction/after-1280.png
docs/ui-v2/evidence/kan-156/correction/after-1440.png
docs/ui-v2/evidence/kan-156/correction/after-375.png
docs/ui-v2/evidence/kan-156/correction/after-768.png
docs/ui-v2/evidence/kan-156/correction/before-1280.png
docs/ui-v2/evidence/kan-156/correction/before-1440.png
docs/ui-v2/evidence/kan-156/correction/before-375.png
docs/ui-v2/evidence/kan-156/correction/before-768.png
docs/ui-v2/evidence/kan-156/correction/browser-results.json
docs/ui-v2/evidence/kan-156/correction/claude-hero-1280.png
docs/ui-v2/evidence/kan-156/correction/claude-hero-1440.png
docs/ui-v2/evidence/kan-156/correction/claude-hero-375.png
docs/ui-v2/evidence/kan-156/correction/claude-hero-768.png
docs/ui-v2/evidence/kan-156/correction/claude-reference-1280.png
docs/ui-v2/evidence/kan-156/correction/claude-reference-1440.png
docs/ui-v2/evidence/kan-156/correction/claude-reference-375.png
docs/ui-v2/evidence/kan-156/correction/claude-reference-768.png
docs/ui-v2/evidence/kan-156/correction/font-fallback-375.png
docs/ui-v2/evidence/kan-156/correction/implementation-hero-1280.png
docs/ui-v2/evidence/kan-156/correction/implementation-hero-1440.png
docs/ui-v2/evidence/kan-156/correction/implementation-hero-375.png
docs/ui-v2/evidence/kan-156/correction/implementation-hero-768.png
docs/ui-v2/evidence/kan-156/correction/supplementary-results.json
docs/ui-v2/evidence/kan-156/correction/v1-parity.json
src/App.vue
src/__tests__/app.spec.ts
src/styles/forClientsV2.spec.ts
src/views/ForClientsView.spec.ts
src/views/ForClientsView.vue
```
