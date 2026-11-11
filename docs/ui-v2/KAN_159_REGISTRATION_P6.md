# KAN-159 — Registration finalization and Public Mobile P6

Date: 2026-10-24. Delivery target: existing **Draft [PR #54](https://github.com/alextesshu/consult-frontend/pull/54)**, branch `feat/ui-v2-stage-1-3b-registration`. Review status: **READY FOR REVIEW**, with the integration gates below. This is registration-local acceptance, not release or production end-to-end acceptance.

## Verified preflight and ownership

- Fetched frontend `origin/dev`: `42a2c8cf25f81c576c8c7a60334100a1ecfea760` (merged public profile PR #55). PR #54 starting HEAD: `eeafc58381858771ab4bf1ec12e85dfb873e4c15`, OPEN Draft, previous automatic CI successful ([run 39821420669](https://github.com/alextesshu/consult-frontend/actions/runs/39821420669)). The existing isolated registration worktree was clean before editing.
- PR #54 predates the current shared shell. No dev merge, rebase, shared-file copy or branding override was performed. The main local frontend dev branch was preserved at `965f5e728233777abb4ef9f0c7bf4e4cbaf57ee7`.
- Public Mobile [PR #64](https://github.com/alextesshu/consult-frontend/pull/64) was OPEN Draft at preflight remote HEAD `23385cac10524b9f4c6f792e925b30a4661053a2`; Claude's local HEAD was `3a9e37e864ea4e0aa5d008d99609793823dbf02e`. Its shared mobile CSS/tests and evidence had local changes. They were inspected read-only for ownership, never edited. Public shell, menu, Home, For Clients, Discovery and Login remain Claude's scope.
- Final fetch found PR #64 **MERGED**, producing current `origin/dev` **`80af43776667374f3dc23b4e5f58227722f5603c`**; its final feature HEAD was `3a1946c56ca5ee455d1a0613db03ee0db3a3d315`. PR #54 remote HEAD was still the original `eeafc583…` before this follow-up push. The newer shared shell was not silently copied or merged into the registration branch.
- No changes to App.vue, components-v2.css, tokens, router, LoginView, API/store implementations, backend, dependencies or other worktrees. UI v1 remains default. KAN-160 remains HOLD.

## Immutable design reference

Canonical snapshot: `claude-design-2026-10-23-4ff7cedd`; archive named v6.6, containing v6.7 changes. Reverified original source ZIP SHA-256:

`4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`

References are pinned to verified dev because this older feature branch does not contain the newer snapshot:

- [Public-Mobile.dc.html, P6](https://github.com/alextesshu/consult-frontend/blob/42a2c8cf25f81c576c8c7a60334100a1ecfea760/docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Public-Mobile.dc.html)
- [Auth.dc.html](https://github.com/alextesshu/consult-frontend/blob/42a2c8cf25f81c576c8c7a60334100a1ecfea760/docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Auth.dc.html)
- [Signup.dc.html](https://github.com/alextesshu/consult-frontend/blob/42a2c8cf25f81c576c8c7a60334100a1ecfea760/docs/ui-v2/snapshots/2026-10-23-4ff7cedd/handoff/mockups/Signup.dc.html)

Original HTML/CSS/JS was inspected, and original P6 and desktop Signup were rendered without source edits. P6 is a static board showing specialist step 2, not an implemented authentication service. Motion timing comes from the original Auth/Signup code, not screenshot inference.

## P6 fidelity and contract matrix

| Source requirement | Implementation / evidence | Status |
| --- | --- | --- |
| Three-step mobile registration | Specialist: name → canonical practice → email/password. Client: name → email → password below 768px; desktop client keeps its approved one-form composition. No API call on intermediate steps. | IMPLEMENTED |
| P6 progress header | 56px local header, 44px back target, centered 13px live step status, semantic three-step list. Bars 4px high, 6px gaps and 20px mobile margins. | IMPLEMENTED |
| P6 content geometry | 24px/20px/120px stage padding; 32px, 1.08 line-height, -.035em, weight 500 heading; 15px/1.55 subtitle; 16px content gap. Desktop specialist form maximum 440px. | IMPLEMENTED |
| Practice chips | Mobile 44px pill targets, 8px gaps, navy selected background and light text. Native radios support arrow keys and Space, with visible focus and field errors. | IMPLEMENTED |
| Prototype practice vocabulary | Eight demo specialties are replaced by the existing six canonical `professional_focus` values. No new taxonomy or unsupported approach field. Longer actual labels wrap the chip group naturally. | CONTRACT PRESERVED |
| Sticky mobile action | 54px button; footer padding 12px 20px max(28px, safe-area bottom), top border. Stage bottom padding and focus visibility correction keep long content reachable. | IMPLEMENTED |
| Focus and navigation | Step transitions focus the first relevant/invalid field; Back preserves in-memory values. Keyboard radio navigation scrolls only enough to clear the fixed footer; typing does not trigger scrolling. Pending focus frames are canceled on unmount. | IMPLEMENTED |
| Motion | Auth opacity 220ms ease and transform 300ms cubic-bezier(.2,.8,.2,1); Signup progress .6s cubic-bezier(.4,0,.2,1). Animations cancel on replacement/unmount. Reduced motion skips WAAPI and CSS transitions; media listeners are removed. | IMPLEMENTED |
| Errors/loading | Native email validity, existing name validation, field-specific server errors and accessible alerts. Client server errors return to the matching mobile step. Busy controls disable repeat submission; existing in-flight guard stays authoritative. | IMPLEMENTED |
| Shared shell / fennec | The old PR #54 shell is visible in full-page captures. No local branding replacement was added. P6's OS status bar is a prototype frame, not product UI. | INTEGRATION GATE |
| Registration success / publication | Actual handlers, redirects, verification and role boundaries are preserved. No fake production success, automatic publication, trial entitlement or fabricated onboarding. | CONTRACT PRESERVED |

## Validation

- Focused registration and adjacent regression Vitest: **261/261 PASS**, 12 files. Includes registration views, wizard, scoped CSS, API registration, auth store, Login, App, attribution and UI version tests.
- Production build: PASS. Existing large-chunk warning remains.
- Typecheck: **9 unchanged baseline diagnostics, 0 new**; advisory command exits nonzero. [Baseline, candidate and comparison](evidence/kan-159/p6/typecheck-comparison.json) retain the actual diagnostic set.
- Chromium: both roles at **375, 390, 640, 768 and 1280px**; step validation, native email validation, keyboard progression/radios, Back retention, password visibility, loading/duplicate guard, server field errors, no credential storage, no horizontal overflow and fixture final redirects. Home, For Clients, Discovery and Login smoke checks reported no page JavaScript errors. These smoke checks are against this branch's shell, not acceptance of the separately integrated dev/PR #64 pages.
- Normal-motion 375px videos for both roles; reduced-motion screenshots across the width matrix. An additional keyboard visibility check covers every actual practice option above the mobile action footer.
- V1 screenshots compare both registration routes against exact starting HEAD at all five widths. All ten computed-style/geometry hashes match. Final pixel differences are **0–97 edge pixels per image**, maximum channel difference **2/255**; this is not claimed as zero-pixel equality. See [pixel results](evidence/kan-159/p6/v1-pixel-parity.json) and [computed-style/geometry hashes](evidence/kan-159/p6/v1-dom-styles.json).
- UTF-8, local Markdown links, approved file scope and `git diff --check` checked before commit. [Manifest](evidence/kan-159/p6/manifest.json) inventories the exact delivery files and hashes; it excludes itself to avoid a recursive checksum.

Browser APIs were explicitly intercepted fixtures throughout. They establish frontend behavior, not browser-to-Django or production registration readiness. The original source screenshots are design evidence, not claims of exact full-page parity with an independently owned shared shell.

## Backend contract and remaining gates

[Backend PR #63](https://github.com/alextesshu/consult-backend/pull/63) remains **OPEN Draft / unmerged**, HEAD `812bba14ab553df447574df5d91d34aa0824a75c`. Its [CI run 39816177674](https://github.com/alextesshu/consult-backend/actions/runs/39816177674) did not execute checks: GitHub reported failed account payments or an increased spending-limit requirement. This is a CI billing gate, not a passing backend run or an observed source-test failure. No rerun or backend modification was performed.

At that exact approved local contract revision, **5/5 Django APIClient integration tests passed** with fresh disposable PostgreSQL, locmem mail and mocked signup notifications. Tests verified both roles without password confirmation, persisted name/focus, login, `/me`, missing-field rejection without user creation, and no automatic specialist publication. `--nomigrations` synchronized an isolated test schema; `btree_gist` was installed only in that disposable database template. This does not validate production migrations. The owned container was stopped and removed. No real user database or external email was used. One existing Google Python 3.11 deprecation warning remains.

The existing JSON contract sends integer `registration_contract_version: 2`, required normalized `first_name`, and canonical `professional_focus` for specialists only. Optional legacy confirmation matching and existing authentication, permissions, cookies, attribution and email-verification boundaries remain backend-owned.

Release/integration gates:

1. Resolve backend CI infrastructure, review and integrate PR #63 through the authorized workflow; deploy compatible backend support before enabling v2 submissions. Never rely on an older API silently ignoring new fields. Disable frontend v2 submissions before rolling back that support.
2. Integrate the registration branch with current dev, which now includes merged PR #64, under explicit shared-file ownership. Recheck fennec header/menu, layout offsets, sticky actions, keyboard/virtual-keyboard behavior and full-page P6 appearance together. This delivery intentionally does not merge/rebase or edit the shared shell.
3. Run controlled browser-to-backend acceptance after integration: real email verification/delivery, invitation acceptance, authenticated onboarding and final destination resources. Isolated APIClient acceptance and fixture redirects are separate evidence.
4. Any extra practice taxonomy, approaches, trial entitlement or prototype-only navigation requires an approved product/backend contract. Do not copy them from demo HTML into production.

No Ready transition, merge, deployment, Jira update, backend PR edit or default-UI change is included.

## Evidence and exact scope

Runtime delta from starting HEAD: `src/components/RegistrationWizardV2.vue`, `src/composables/useRegistrationViewport.ts`, `src/styles/registrationP6.css`, `src/views/SignupView.vue`, `src/views/ClientSignupView.vue`.

Test delta: `src/components/RegistrationWizardV2.spec.ts`, `src/styles/registrationP6.spec.ts`, `src/views/ClientSignupView.spec.ts`.

Documentation/evidence: this report and files listed in [manifest.json](evidence/kan-159/p6/manifest.json). The whole PR also contains the previously reviewed registration API/store work; this follow-up does not alter those implementations.

See [evidence README](evidence/kan-159/p6/README.md) for reproducible commands, original source captures, role/width screenshots and motion videos.
