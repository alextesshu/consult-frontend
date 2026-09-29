# Frontend release-debt register

Evidence snapshot: 2026-09-29 (KAN-127 Phase A). This register records audited
release state, not every historical commit. The staging checkout was clean at
`df8929de7d676374e90a0279021b0dcfdf1b7444` (`dev`); the dedicated
production checkout was clean at
`9e1856e440ad72c9eaea0eaacb7352e75cc3f461` (`main`). At audit time the
production frontend container was running and the public site `/` returned
HTTP 200; backend `/healthz` and `/readyz` also returned HTTP 200. The running
frontend image's commit was not independently attested.
Local and live remote refs agreed. No confirmed `STAGED_READY` frontend content
remained absent from the audited production source; the oldest confirmed open
staging-approved release age is therefore not applicable.

`RELEASED` requires production runtime evidence, not a merged PR alone.
`STAGED_READY` means staging acceptance passed but production is not verified.
`DEFERRED` requires a recorded owner, decision time, reason, and next review.
`DEV_ONLY` lacks staging approval; `MAIN_ONLY` is production-side history not
reconciled to dev; `AMBIGUOUS` means evidence is insufficient. Raw ahead/behind
counts and unmatched commit SHAs are not release debt. Record unknown fields as
unknown; do not infer an approval or owner from a commit author. The shared
promotion policy is in the backend repository's `docs/GIT_CI_PROMOTION.md`.

| Ticket / scope | Status | Staging SHA; acceptance time | Staging CI / acceptance | Release owner | Decision; time; deferral reason | Production PR; deployed source SHA; runtime evidence | Next review |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KAN-107 GeoIP minimization | RELEASED | `df8929de`; exact acceptance time not recorded | [dev CI 36339948253](https://github.com/alextesshu/consult-frontend/actions/runs/36339948253) PASS; staging acceptance recorded in [PR #23](https://github.com/alextesshu/consult-frontend/pull/23) | Not recorded | PROMOTE executed; decision time not recorded; no deferral | PR #23, [PR CI 36341364784](https://github.com/alextesshu/consult-frontend/actions/runs/36341364784) PASS; `9e1856e4` in clean production checkout; frontend running and public `/` 200 on 2026-09-29 | Not applicable for code; privacy transport check remains separate |
| KAN-121 trial, payment-instruction, and confirmation UI | RELEASED | Earlier staging SHAs vary by slice; exact acceptance times not recorded | Staging acceptance recorded for approved slices; no new frontend content in KAN-121 PR #34 | Not recorded | PROMOTE executed for prior release PRs; decision times not recorded | [PR #18](https://github.com/alextesshu/consult-frontend/pull/18), [#19](https://github.com/alextesshu/consult-frontend/pull/19), [#20](https://github.com/alextesshu/consult-frontend/pull/20) merged; their content is in current production source `9e1856e4`; frontend running and public `/` 200 on 2026-09-29 | Not applicable; release complete |
| Unattributed dev-only `AGENTS.md` policy and `src/__tests__/app.spec.ts` changes | DEV_ONLY | `df8929de` checkout; no acceptance time or approval | No independent staging acceptance recorded for this scope | Not recorded | No PROMOTE/DEFER decision recorded | No production PR for this exact scope; production tree differs | Not assigned |
| KAN-105 role-specific email-verification return route | MAIN_ONLY | Not applicable; absent from dev content | Not a staging-approved dev change | Not recorded | Separate reconciliation decision needed | Present in production `src/views/VerifyEmailView.vue` and its test at `9e1856e4`; preserve before any dev-to-main promotion | Not assigned |
| KAN-107 live PostHog transport / new-event enrichment verification | AMBIGUOUS | Staging code accepted; live production transport check not part of staging approval | Code/tests and CI PASS; browser/network and newly ingested event evidence not established by the release audit | Not recorded | Not a code-promotion decision; verification remains open | Code released via PR #23; this row does not imply a missing deploy or a PostHog settings change | Not assigned |

Source commit `79e3b9a` is patch-equivalent to KAN-107 release commit
`87c0f85`; both analytics file blobs match between current main and dev.
Earlier KAN-118/119 frontend release slices are also present in main. The
only current frontend tree differences between `origin/main` and `origin/dev`
are `AGENTS.md`, `src/__tests__/app.spec.ts`, and the two
`VerifyEmailView` files. Do not infer unreleased functionality from the
historical commit divergence alone.

After a future staging PASS, add or update a ticket row immediately, record
its actual acceptance time and named decision owner, then decide PROMOTE or
DEFER. Surface unresolved lag after 24 hours; after 72 hours a documented
promotion or valid deferral is required. A merged PR is not `RELEASED` until
the production deploy and runtime evidence are recorded. Jira should link to
this register and carry the supporting delivery evidence.
