# KAN-159 — Final registration integration

2026-10-24. **READY FOR FINAL REVIEW**, existing Draft [frontend PR #54](https://github.com/alextesshu/consult-frontend/pull/54), branch `feat/ui-v2-stage-1-3b-registration`.

## Synchronization and ownership

Starting HEAD and remote PR HEAD were both `8f81967a2e5aecdd4e7024edaebc203c5c0b4f4d`; worktree/index were clean. Fetched `origin/dev` was `c864fcb629a372170c79b8ae33e409c4c9091f78`, including merged Public Mobile PR #64 and Specialist Dashboard PR #65. Active frontend PRs at preflight were registration #54 and client dashboard #57. The separate Cabinet Shell worktree/branch was not changed.

Integrated that exact dev revision using a normal two-parent merge, without force push. **No conflicts and no manual runtime edits.** All registration implementation files remain byte-identical to starting HEAD. App.vue, shared components-v2.css, tokens, router and LoginView are exactly the incoming dev versions; this task did not make shared-file changes. The main local frontend dev worktree was not updated/reset. This authorized branch synchronization does not merge PR #54 into dev.

This report supersedes the old shared-shell integration gate in [the previous registration-local report](KAN_159_REGISTRATION_P6.md). Its old-shell screenshots and manifest remain historical evidence for `8f81967…`, not the final integrated acceptance. Use the new [integration inventory/checksums](evidence/kan-159/integration/manifest.json) for final PR scope relative to current dev.

## P6 fidelity matrix

Canonical source: `claude-design-2026-10-23-4ff7cedd`, archive v6.6 / contents v6.7. Reverified original ZIP SHA-256: `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`.

Original references: [Public-Mobile P6](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Public-Mobile.dc.html), [Auth](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Auth.dc.html), [Signup](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Signup.dc.html). The original source and prior rendered reference captures were compared, including CSS/JS timing rather than screenshots alone.

| Area | Final integrated result | Classification |
| --- | --- | --- |
| Mobile three steps | Specialist name → canonical practice → email/password; client name → email → password below 768px. Intermediate steps do not submit. Desktop client keeps the approved one-form layout. | PASS |
| Local progress/composition | 56px registration progress header, 44px Back target, three 4px bars/6px gaps, 20px side margins; 24px/20px/120px stage spacing; 32px heading, 15px subtitle. | PASS |
| Practices | Existing six canonical backend enum values use native radio chips; mobile 44px targets, navy selected/light text and keyboard focus. All six stay visible when focused. | PASS; prototype's eight demo specialties are not a new contract |
| Actions | One 54px action in fixed mobile footer with safe-area support. Public header does not repeat the signup CTA on signup. Header, progress and actions do not overlap at tested widths. | PASS |
| Motion | Existing 220ms opacity / 300ms transform Auth transition; .6s progress; cancellation/cleanup preserved. Normal-motion videos retained; reduced-motion matrix has no pending wizard animation. | PASS |
| Form behavior | Name/required/email validation, server field errors, busy/duplicate guard, password visibility, Back retention and error focus remain intact after synchronization. | PASS |
| Navigation | Header signup action, Login specialist role → Signup, browser Back/Forward, reload and v2 state persistence pass at five widths. Login's client role intentionally offers discovery; its role behavior was not changed. | PASS |
| Branding / shared shell | Approved fennec header/footer from merged dev are retained, with one wizard and no horizontal overflow. Home, For Clients, Discovery and Login fixture smoke checks show no page JavaScript errors. | PASS |
| Dedicated authentication header | Prototype's standalone 56px auth header differs from the integrated 60px public mobile header plus local 56px progress header. No shared App.vue override or Cabinet Shell change was introduced. | DOCUMENTED DESIGN DIFFERENCE |
| Product/backend limits | No additional taxonomy, approaches, fabricated trial entitlement, fake production API, automatic publication or successful registration simulation in runtime code. | CONTRACT PRESERVED |

## Verification and evidence

- **246/246 focused/regression Vitest PASS**, 11 files: SignupView, ClientSignupView, RegistrationWizardV2, signupV2 CSS, registrationP6 CSS, registration API, auth store, LoginView, LoginView.v2, App and publicMobileV2 CSS tests.
- Production build PASS, retaining the existing chunk-size warning. `git diff --check` PASS.
- Forced typecheck against a fresh detached checkout of exact current dev: **9 identical diagnostics, 0 new**, both advisory commands exit nonzero. [Comparison](evidence/kan-159/integration/typecheck-comparison.json).
- Chromium specialist and client registration at **375, 390, 640, 768, 1280px**. Covered progression, native input/radio keyboard behavior, missing fields/email validity, server errors, loading/duplicate guard, retained Back values, no credential storage, no horizontal overflow, fixture final redirects and adjacent public pages.
- Additional native-radio visibility checks at three mobile widths, and separate auth/header/history/navigation checks at all five widths. [Browser matrix](evidence/kan-159/integration/browser-results.json), [navigation geometry](evidence/kan-159/integration/navigation.json), [keyboard](evidence/kan-159/integration/keyboard-visibility.json).
- **V1 baseline is exact current dev**, not the older registration branch. All ten element-geometry/computed-style hashes are identical. Final screenshots have **41–97 edge-pixel differences/image**, max channel delta **2/255**; no claim of exact zero-pixel equality. [Pixel results](evidence/kan-159/integration/v1-pixel-parity.json), [style hashes](evidence/kan-159/integration/v1-dom-styles.json).
- [New-shell specialist P6](evidence/kan-159/integration/signup-375-step2.png), [client email](evidence/kan-159/integration/signup-client-375-step2.png), [specialist final step](evidence/kan-159/integration/signup-375-account.png), [client final step](evidence/kan-159/integration/signup-client-375-account.png), [specialist motion](evidence/kan-159/integration/signup-375-motion.webm), [client motion](evidence/kan-159/integration/signup-client-375-motion.webm). The full width/state inventory and reproducible scripts are in the integration directory.

Browser API responses were explicitly intercepted fixtures. Fixture error responses and successful redirect checks establish frontend behavior, not real browser-to-Django registration readiness. Screen-reader semantics are covered by DOM/role assertions; this is not manual assistive-device acceptance. Desktop Chromium mobile emulation does not establish real phone virtual-keyboard behavior.

## Backend status and acceptance gates

[Backend PR #63](https://github.com/alextesshu/consult-backend/pull/63) was rechecked: **OPEN Draft / unmerged**, HEAD `812bba14ab553df447574df5d91d34aa0824a75c`. Existing registration-v2 API documentation/tests remain the available approved local contract. Requests use integer contract version 2, required normalized first_name, specialist-only canonical professional_focus and optional matching confirmation. Existing auth/permissions/verification/cookie/attribution boundaries are unchanged.

Its [CI run 39816177674](https://github.com/alextesshu/consult-backend/actions/runs/39816177674) still reports checks FAILURE and tests SKIPPED. The check annotation explicitly says the job was not started because account payments failed or a spending limit must increase. No source-test failure was inferred, no billing setting changed, no rerun or backend merge performed.

Fresh isolated acceptance at the exact PR #63 revision: **5/5 Django APIClient tests PASS**. Both roles register without confirmation; name/focus persist; login and `/me` work; missing required fields create no account; specialist profile is not automatically published/search-visible. A disposable PostgreSQL 16 tmpfs container used localhost:58504, locmem mail and mocked welcome/founder notifications. `btree_gist` was created only in its template1, with `--nomigrations` isolated schema sync. The container was stopped/removed. No external email, real user database, backend code or migrations were touched. One existing Google Python-version deprecation warning remains. [Fresh log](evidence/kan-159/integration/backend-integration.txt); reproducible test/settings are retained in the previous P6 evidence.

Remaining gates:

1. Resolve backend CI billing infrastructure, review/integrate PR #63 through the authorized process and deploy compatible backend support before enabling v2 registration. Do not rely on an old backend ignoring new fields. Disable v2 submissions before rolling that support back.
2. After backend integration, perform controlled browser-to-backend signup, verification/email delivery, invitation acceptance and authenticated onboarding/destination acceptance. Isolated API tests and fixture browser redirects do not replace this.
3. Dedicated mobile authentication header remains the documented design difference above. Any future shared-header change requires explicit Cabinet Shell ownership coordination. Real phone/virtual-keyboard and manual screen-reader acceptance remain separate device checks.

UI v1 remains default; KAN-160 remains HOLD. PR #54 stays Draft. No new frontend PR, Jira update, Ready transition, PR merge or deployment is part of this delivery. Automatic CI for the pushed final SHA is recorded in PR #54 after completion; no manual CI dispatch/rerun is used.
