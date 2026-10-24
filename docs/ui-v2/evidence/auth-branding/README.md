# Public UI v2 — branding for signed-in users

**Defect:** in UI v2, signed-in specialists and clients saw the legacy `proconsult-logo-dark.png` / `-light.png` in the header and footer of public pages, while guests saw the approved fennec.

**Cause:** `src/App.vue` chose the fennec only through `usePublicHeaderV2 = isUiV2() && !isAuthenticated && !useMinimalShell`. KAN-158 had scoped its brand override to guest chrome («Never affects v1/auth chrome»).

Base: `origin/dev` 72ddf20 (includes Cabinet Shell #66).

## Change

| File | Change |
|---|---|
| `src/App.vue` | New `useV2Brand = isUiV2() && !useMinimalShell`. The header shows the existing `fennecHeader` when `useV2Brand`, otherwise the unchanged v1 logo frame. `usePublicFooterV2` now depends on `useV2Brand` instead of the guest-only flag, so signed-in users get the same existing v2 public footer with `fennecLockup`. The specialist-owned footer logo also uses `useV2Brand`. Header actions, menus, guest-only header and cabinet shell are untouched. |
| `src/styles/components-v2.css` | Signed-in v2 header (not guest, not cabinet shell) sizes the lockup at the approved 32px (`--pc-space-8`), the same height as the guest header. Layout and controls are unchanged. |
| `src/__tests__/app.spec.ts` | Regression tests. One existing test that asserted the old guest-only scope is updated: signed-in v2 now expects the fennec. |

No SVG asset, v1 logo, router, API, auth store, registration (KAN-159) or backend file is touched.

## Branding matrix (Chromium, browser fixtures, 240 checks)

Covers 375/390/768/1280/1440 × guest/specialist/client × v1/v2 × `/`, `/for-clients`, `/specialists`, `/faq`, `/login`, `/signup`, `/s/olena`, `/cabinet` (`branding-candidate.json` vs `branding-baseline.json`, checked by `summarize.py`: 0 problems).

| UI | Role | Header | Footer |
|---|---|---|---|
| v2 | guest | fennec header (unchanged) | fennec lockup (unchanged) |
| v2 | specialist | **fennec header** (was legacy) | **fennec lockup** (was legacy) |
| v2 | client | **fennec header** (was legacy) | **fennec lockup** (was legacy) |
| v2 | specialist `/cabinet` | fennec (Cabinet Shell, unchanged) | legacy cabinet footer (unchanged, see limitations) |
| v1 | guest / specialist / client | legacy logo or mobile mark, identical to `origin/dev` | legacy dark/light, identical to `origin/dev` |

Every row also checks that the header height is identical to the baseline, the signed-in lockup is 32px high, and there is no new horizontal overflow.

Screenshots: `candidate-v2-<role>-<375|1280>-<home|for-clients|s-olena|cabinet>-header|footer.png`; baseline values are in `branding-baseline.json`.

## V1 pixel parity

56 full-page pairs: guest 5 routes, specialist 5 (incl. `/cabinet`), client 4, each at 375/768/1280/1440, against `origin/dev`, with a second baseline capture as noise control. All 56 match exactly (`parity.json`).

## Known limitations and decisions

- **Home footer for signed-in users.** In v2 it used to be the legacy navy Home footer with the light legacy logo; it is now the existing cream v2 footer that guests see.
  - The approved navy fennec cannot be placed on the navy background: the brand rules forbid recolouring the lockup.
  - Link set and actions are the same as the legacy public footer (both include «Увійти» / «Створити простір»).
- **Signed-in header.** Only the logo changes; the legacy authenticated header styling (gradient, tagline, «Кабінет», menus) stays, as required. A full v2 restyle of the signed-in public header would be a separate design task.
- **Cabinet footer** (`/cabinet*` in v2) still shows the legacy logo. It belongs to the Cabinet Shell, which this task must not change.

## Verification

- Vitest:
  - focused `app.spec.ts` + style contracts: 10 files / 152 tests;
  - full suite: 127 files / 1943 tests passed.
- `vue-tsc -b`: 9 errors on both `origin/dev` 72ddf20 and this branch, the same set.
- `vite build`: OK. `git diff --check`: OK.
- Cabinet Shell: its unit/integration tests pass; in Chromium the `/cabinet` header and footer are identical to the baseline at every width.
