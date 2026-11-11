# KAN-158 selected consultation card contrast

Existing [Draft PR #55](https://github.com/alextesshu/consult-frontend/pull/55), branch `feat/ui-v2-stage-2-1-public-profile`, baseline `7a535bd6577dc4321c05f1d65cb65ba669a7b415`. Source remains `claude-design-2026-10-23-4ff7cedd`, archive v6.6 / contents v6.7, SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.

The V2 active button already had a navy background and white foreground, but scoped `.guest-offer-option__label` and `__meta` declared their own dark colors. Explicit child colors override inherited button color. Chromium reproduced contrast of **1.25:1** for the title and **2.59:1** for duration/price on navy.

The fix explicitly applies card-white to both selected descendants. Disabled cards retain opacity1 to avoid blending their foreground/background into a failing pair; a dashed border and existing disabled semantics/cursor distinguish them. A related summary-step defect was found: secondary copy was4.34:1 on the soft background. Summary eyebrow and metadata now use the existing body-text token.

The palette is canonical navy `#12345A`, white `#FFFFFF` and existing body-text tokens. The [Claude desktop HTML](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile.dc.html) uses this navy/white pair for selected dark controls; its offer rail has a light active surface. This scoped correction preserves the requested existing dark guest-picker state and does not redesign the offer rail or booking flow.

## Computed browser results

| Content/state | Minimum contrast |
| --- | --- |
| Selected title, duration and price; hover, keyboard focus and selected-disabled | **12.62:1** |
| All tested card text, including unselected/disabled/hover/focus | **4.87:1** |
| Selected-offer summary title, duration, price and eyebrow | **7.85:1** |

All exceed the requested4.5:1 normal-text threshold. Ratios use Chromium computed opaque sRGB colors, standard sRGB linearization and `(Llighter + .05) / (Ldarker + .05)`. Disabled opacity is explicitly checked at1; disabled probes do not rely on the WCAG inactive-control exception. Keyboard focus has an actual outline of at least2px; pointer focus is not incorrectly treated as focus-visible.

Chromium checks actual local Django profile `/s/specialist?ui=v2` at375x677,768x900,1280x900,1440x900, both standard and intro offers. The matrix covers selected/unselected normal, hover, keyboard focus, selected-disabled and unselected-disabled, plus the real summary/Change step. Disabled flags are presentation-only DOM probes and do not alter backend eligibility. The real public DTOs are reused only for baseline/V1 comparison to avoid extra requests; candidate V2 GETs are direct. No guest POST is sent. Wheel scrolling uses the existing sidebar or native sheet and preserves document position.

## Validation and exact scope

- Focused CSS/scroll/identity tests: **15/15 PASS**, three files.
- Production build PASS, explicitly captured exit code0; existing chunk-size warning. PowerShell stderr warning presentation is not treated as a failed Vite build.
- V1 full-page pixel parity: **0 changed pixels** at all four widths.
- `git diff --check`, UTF-8/relative links, computed contrast matrix and exact file hashes verified by the evidence validator.
- Automatic CI terminal result is recorded in Draft PR #55 and final response; no manual rerun.

Only `src/styles/publicProfileV2.css` and `src/styles/publicProfileV2.spec.ts` change outside this report/evidence directory. No Vue/TypeScript runtime, business logic, API, permissions, dependencies, backend, shared shell, fennec, other pages or worktrees change. Existing [request scroll correction](KAN_158_REQUEST_SCROLL.md) remains intact. UI v1 stays default.

```powershell
npm run test:run -- src/styles/publicProfileV2.spec.ts src/lib/profilePanelScroll.spec.ts src/components/public-profile/PublicProfileIdentityRail.spec.ts --maxWorkers=1 --minWorkers=1
npm run build
python -X utf8 docs/ui-v2/evidence/kan-158/offer-contrast/validate_delivery.py
git diff --check
```

[Computed colors, ratios and state matrix](evidence/kan-158/offer-contrast/contrast-results.json), [exact files/hashes](evidence/kan-158/offer-contrast/files.json), [V1 parity](evidence/kan-158/offer-contrast/v1-parity.json), [tests](evidence/kan-158/offer-contrast/focused-tests.txt), [build](evidence/kan-158/offer-contrast/build.txt).

Screenshots: [before](evidence/kan-158/offer-contrast/before-1440.png), [desktop standard selected](evidence/kan-158/offer-contrast/1440-standard-selected.png), [desktop intro selected](evidence/kan-158/offer-contrast/1440-intro-selected.png), [mobile selected](evidence/kan-158/offer-contrast/375-standard-selected.png), [keyboard focus](evidence/kan-158/offer-contrast/1440-standard-focus.png), [disabled](evidence/kan-158/offer-contrast/1440-standard-selected-disabled.png), [summary](evidence/kan-158/offer-contrast/1440-standard-summary.png).

Existing product/backend gates remain unchanged, including isolated real submit/PENDING acceptance, OG/private preview/anonymous inquiry/guest consent. KAN-160 HOLD, backend PR #63 untouched. Draft only; stop at READY FOR VISUAL RE-REVIEW. No new PR, Ready transition, merge, deploy or Jira changes.
