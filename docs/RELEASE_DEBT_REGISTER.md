# Frontend release-debt register

<!-- release-debt-contract-v1
{
  "schema_version": 1,
  "records": [
    {
      "id": "kan-107-geoip-minimization",
      "ticket": "KAN-107",
      "repository": "consult-frontend",
      "status": "RELEASED",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; unknown fields remain explicit.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {
        "sha": "df8929de7d676374e90a0279021b0dcfdf1b7444",
        "acceptance_completed_at": null,
        "evidence": "Dev CI 36339948253 PASS; staging acceptance is recorded in PR #23."
      },
      "release_owner": null,
      "decision": {
        "kind": "PROMOTE",
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": "https://github.com/alextesshu/consult-frontend/pull/23",
        "deployed_source_sha": "9e1856e440ad72c9eaea0eaacb7352e75cc3f461",
        "runtime_evidence": "Clean production checkout; frontend running; public site returned HTTP 200 on 2026-09-29."
      }
    },
    {
      "id": "kan-121-billing-ui",
      "ticket": "KAN-121",
      "repository": "consult-frontend",
      "status": "RELEASED",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; unknown fields remain explicit.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {
        "sha": null,
        "acceptance_completed_at": null,
        "evidence": "Earlier staging SHAs vary by slice."
      },
      "release_owner": null,
      "decision": {
        "kind": "PROMOTE",
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": "https://github.com/alextesshu/consult-frontend/pull/20",
        "deployed_source_sha": "9e1856e440ad72c9eaea0eaacb7352e75cc3f461",
        "runtime_evidence": "Current production source contains the approved UI slices; frontend running and public site returned HTTP 200 on 2026-09-29."
      }
    },
    {
      "id": "unattributed-dev-policy-and-app-test",
      "ticket": "UNATTRIBUTED-DEV-POLICY-AND-TEST",
      "repository": "consult-frontend",
      "status": "DEV_ONLY",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; no independent staging acceptance was recorded.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {
        "sha": "df8929de7d676374e90a0279021b0dcfdf1b7444",
        "acceptance_completed_at": null,
        "evidence": null
      },
      "release_owner": null,
      "decision": {
        "kind": null,
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": null,
        "deployed_source_sha": null,
        "runtime_evidence": null
      }
    },
    {
      "id": "kan-105-role-return-route",
      "ticket": "KAN-105",
      "repository": "consult-frontend",
      "status": "MAIN_ONLY",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; the production-only scope requires reconciliation.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {
        "sha": null,
        "acceptance_completed_at": null,
        "evidence": null
      },
      "release_owner": null,
      "decision": {
        "kind": null,
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": null,
        "deployed_source_sha": "9e1856e440ad72c9eaea0eaacb7352e75cc3f461",
        "runtime_evidence": "Present in production source checkout."
      }
    },
    {
      "id": "kan-107-posthog-transport-verification",
      "ticket": "KAN-107",
      "repository": "consult-frontend",
      "status": "AMBIGUOUS",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; live transport evidence was incomplete.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {
        "sha": "df8929de7d676374e90a0279021b0dcfdf1b7444",
        "acceptance_completed_at": null,
        "evidence": "Staging code was accepted; live production transport inspection was not established."
      },
      "release_owner": null,
      "decision": {
        "kind": null,
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": "https://github.com/alextesshu/consult-frontend/pull/23",
        "deployed_source_sha": null,
        "runtime_evidence": null
      }
    },
    {
      "id": "kan-107-identify-dedup",
      "ticket": "KAN-107",
      "repository": "consult-frontend",
      "status": "RELEASED",
      "historical_evidence": false,
      "historical_reason": null,
      "evidence_snapshot_at": null,
      "staging": {
        "sha": "581bca108b4195051610587bf4e58b313044a7c5",
        "acceptance_completed_at": null,
        "evidence": "Operator-confirmed canonical staging frontend deploy, /healthz, /readyz, specialist login/logout/relogin/reload, and admin UI smoke PASS. Exact UTC completion timestamp of full staging acceptance is unrecoverable; it is not replaced by operator confirmation time. Staging analytics was disabled by contract."
      },
      "release_owner": null,
      "decision": {
        "kind": "PROMOTE",
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": "https://github.com/alextesshu/consult-frontend/pull/28",
        "deployed_source_sha": "f8a12d372d2fc506f7bf4345ac0ae22133cdf0a5",
        "runtime_evidence": "Canonical production frontend deploy and clean main checkout verified on 2026-10-04; frontend running; /healthz and /readyz HTTP 200; public / HTTP 200 HTML. Operator-confirmed manual auth smoke PASS and fresh PostHog evidence: $identify=2, identities=1, sessions=1, $geoip_disable=true on 2/2 identify events, city/postal/latitude enrichment=0; explicit profile_setup_opened, profile_section_opened, search_visibility_cta_viewed observed; no fresh $pageview, $autocapture, or $exception. Same-runtime deduplication is primarily verified by regression tests; production rows do not directly identify a JS runtime. The historical six duplicate events were not proven to originate from this defect."
      }
    },
    {
      "id": "kan-122-actionable-readiness-chips",
      "ticket": "KAN-122",
      "repository": "consult-frontend",
      "status": "RELEASED",
      "historical_evidence": false,
      "historical_reason": null,
      "evidence_snapshot_at": null,
      "staging": {
        "sha": "e45d8b8b861ed3be478408e6f0a1a4b40cd23719",
        "acceptance_completed_at": "2026-10-07T13:23:00Z",
        "evidence": "Dev CI 37614678425 PASS. Canonical staging frontend deploy via scripts/deploy/deploy-staging-frontend.sh fast-forwarded the staging checkout to e45d8b8b861ed3be478408e6f0a1a4b40cd23719 and recreated frontend-staging successfully. Post-deploy frontend service was running; /healthz returned status ok; /readyz returned database ok and migrations ok. Operator-confirmed KAN-122 manual UX smoke PASS: each missing readiness chip navigated to its own exact section/destination, keyboard/focus behavior passed, unsaved same-page changes were preserved, first_contact routing followed readiness state, and completed/request_only states did not show false actionable missing items. Full staging acceptance completed at 2026-10-07T13:23:00Z (16:23 Kyiv), confirmed by the operator."
      },
      "release_owner": "Oleksandr Konstantinov",
      "decision": {
        "kind": "PROMOTE",
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": "https://github.com/alextesshu/consult-frontend/pull/30",
        "deployed_source_sha": "aaedf35b55718d267b0d3827e65707c93bb296de",
        "runtime_evidence": "Canonical production frontend deploy from /opt/proconsult/backend-production completed successfully on 2026-10-07. Production frontend checkout was clean at aaedf35b55718d267b0d3827e65707c93bb296de; frontend service was running; /healthz returned status ok; /readyz returned database ok and migrations ok; public homepage returned HTTP 200. Operator-confirmed KAN-122 production UX smoke PASS at 2026-10-07T16:59:30Z (19:59 Kyiv): missing readiness chips navigated to the expected exact destinations and no release-specific regression was observed."
      }
    },
    {
      "id": "kan-130-specialist-results-above-fold",
      "ticket": "KAN-130",
      "repository": "consult-frontend",
      "status": "RELEASED",
      "historical_evidence": false,
      "historical_reason": null,
      "evidence_snapshot_at": null,
      "staging": {
        "sha": "d3714a900266d8e9f96b4ebd6023a9f42b3225b3",
        "acceptance_completed_at": "2026-10-07T18:48:01Z",
        "evidence": "Dev CI 37667391033 (#920) PASS. Canonical staging frontend deploy via scripts/deploy/deploy-staging-frontend.sh fast-forwarded the staging checkout to d3714a900266d8e9f96b4ebd6023a9f42b3225b3 and recreated frontend-staging successfully. Post-deploy frontend service was running; /healthz returned status ok; /readyz returned database ok and migrations ok. Operator-confirmed 1440×900 KAN-130 UX smoke PASS: results count, results heading, and the meaningful top of the first specialist card were visible without scrolling."
      },
      "release_owner": "Oleksandr Konstantinov",
      "decision": {
        "kind": "PROMOTE",
        "at": null,
        "reason": null,
        "next_review_at": null
      },
      "production": {
        "pr": "https://github.com/alextesshu/consult-frontend/pull/32",
        "deployed_source_sha": "149cb27d16bd0e5f2a7aa599451a25d32a24491f",
        "runtime_evidence": "Canonical production frontend deploy from /opt/proconsult/backend-production completed successfully on 2026-10-07. Production frontend checkout was clean at 149cb27d16bd0e5f2a7aa599451a25d32a24491f; frontend service was running; /healthz returned status ok; /readyz returned database ok and migrations ok; public homepage returned HTTP 200. Operator-confirmed desktop /specialists UX smoke PASS. Narrow mobile 375×667 remains vertically dense, with results below the first viewport; this was explicitly accepted as a non-blocking limitation and deferred to KAN-131. Release acceptance recorded at 2026-10-07T19:43:22Z (22:43 Kyiv)."
      }
    }
  ]
}
-->

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

Current KAN-107 identify-dedup release evidence (2026-10-04) is recorded
separately from that historical snapshot. PR #28 was deployed from
`f8a12d372d2fc506f7bf4345ac0ae22133cdf0a5`; production runtime and HTTP
checks passed, with manual auth and fresh PostHog results confirmed by the
operator. The exact staging acceptance completion timestamp is unrecoverable
and remains null. The historical `kan-107-posthog-transport-verification`
record remains `AMBIGUOUS`: fresh evidence verifies current transport but
does not establish the PR #23 runtime state at the 2026-09-29 snapshot.

The `release-debt-contract-v1` block above is the canonical machine-readable
source of each record's status and fields. The narrative below is supporting
evidence only; it must not introduce an independent status value.
`historical_evidence=true` is a review-controlled exception: the validator
checks its structure but cannot prove the classification is truthful. Its
snapshot timestamp records publication of the Phase A reconciliation evidence;
it does not replace an unknown staging acceptance timestamp.

`RELEASED` requires production runtime evidence, not a merged PR alone.
`STAGED_READY` means staging acceptance passed but production is not verified.
`DEFERRED` requires a recorded owner, decision time, reason, and next review.
`DEV_ONLY` lacks staging approval; `MAIN_ONLY` is production-side history not
reconciled to dev; `AMBIGUOUS` means evidence is insufficient. Raw ahead/behind
counts and unmatched commit SHAs are not release debt. Record unknown fields as
unknown; do not infer an approval or owner from a commit author. The shared
promotion policy is in the backend repository's `docs/GIT_CI_PROMOTION.md`.

| Ticket / scope | Staging evidence | Decision evidence | Production evidence / next review |
| --- | --- | --- | --- |
| KAN-107 GeoIP minimization | `df8929de`; [dev CI 36339948253](https://github.com/alextesshu/consult-frontend/actions/runs/36339948253) PASS; staging acceptance recorded in [PR #23](https://github.com/alextesshu/consult-frontend/pull/23) | PROMOTE executed; exact decision time not recorded | PR #23, [PR CI 36341364784](https://github.com/alextesshu/consult-frontend/actions/runs/36341364784) PASS; `9e1856e4` clean production checkout; frontend running and public `/` 200 on 2026-09-29 |
| KAN-121 trial, payment-instruction, and confirmation UI | Earlier staging SHAs vary by slice; acceptance times not recorded | PROMOTE executed for prior release PRs; decision times not recorded | [PR #18](https://github.com/alextesshu/consult-frontend/pull/18), [#19](https://github.com/alextesshu/consult-frontend/pull/19), [#20](https://github.com/alextesshu/consult-frontend/pull/20) merged; content in production source `9e1856e4`; frontend running and public `/` 200 |
| Unattributed dev-only GitHub-access policy and app test | No independent staging acceptance recorded | No PROMOTE/DEFER decision recorded | Production tree differs; review required |
| KAN-105 role-specific email-verification return route | Not a staging-approved dev change | Separate reconciliation decision needed | Present in production `VerifyEmailView` code/tests at `9e1856e4`; preserve before dev-to-main promotion |
| KAN-107 live PostHog transport / enrichment verification | Staging code accepted; live production transport inspection not established | Not a code-promotion decision | Code released via PR #23; no PostHog settings change asserted |
| KAN-107 identify deduplication | `581bca1`; operator-confirmed canonical deploy, health/readiness, specialist login/logout/relogin/reload, and admin UI smoke PASS; exact acceptance timestamp unrecoverable (null) | PROMOTE executed via PR #28; exact decision time not recorded | [PR #28](https://github.com/alextesshu/consult-frontend/pull/28); `f8a12d3` clean main checkout, frontend running, health/readiness HTTP 200 and public / HTTP 200 HTML; manual auth PASS; fresh PostHog transport/enrichment evidence in the canonical record |
| KAN-122 actionable profile-readiness chips | `e45d8b8`; dev CI [37614678425](https://github.com/alextesshu/consult-frontend/actions/runs/37614678425) PASS; canonical staging frontend deploy PASS; frontend-staging running; health/ready PASS; operator-confirmed focused KAN-122 UX smoke PASS | PROMOTE executed via [PR #30](https://github.com/alextesshu/consult-frontend/pull/30); release owner Oleksandr Konstantinov; exact promotion-decision timestamp not separately recorded | `aaedf35`; canonical production frontend deploy PASS; frontend running; health/ready PASS; homepage HTTP 200; operator-confirmed production UX smoke PASS at 2026-10-07T16:59:30Z |
| KAN-130 specialist results above the fold | `d3714a9`; dev CI [37667391033](https://github.com/alextesshu/consult-frontend/actions/runs/37667391033) PASS; canonical staging frontend deploy PASS; health/ready PASS; operator-confirmed 1440×900 UX smoke PASS | PROMOTE executed via [PR #32](https://github.com/alextesshu/consult-frontend/pull/32); release owner Oleksandr Konstantinov; exact promotion-decision timestamp not separately recorded | `149cb27`; canonical production frontend deploy PASS; frontend running; health/ready PASS; homepage HTTP 200; desktop `/specialists` UX smoke PASS; 375×667 compaction deferred to KAN-131 |

Source commit `79e3b9a` is patch-equivalent to KAN-107 release commit
`87c0f85`; both analytics file blobs match between current main and dev.
Earlier KAN-118/119 frontend release slices are also present in main. The
only current frontend tree differences between `origin/main` and `origin/dev`
are `AGENTS.md`, `src/__tests__/app.spec.ts`, and the two
`VerifyEmailView` files. Do not infer unreleased functionality from the
historical commit divergence alone.

KAN-122 is `RELEASED`. Staging acceptance completed at `2026-10-07T13:23:00Z` (16:23 Kyiv). PR #30 merged to `main` as `aaedf35b55718d267b0d3827e65707c93bb296de`, the canonical production frontend deploy completed successfully, production health/readiness and homepage checks passed, and the operator confirmed the release-specific production UX smoke at `2026-10-07T16:59:30Z` (19:59 Kyiv).

KAN-130 is `RELEASED`. Staging acceptance completed at `2026-10-07T18:48:01Z` (21:48 Kyiv) on source `d3714a900266d8e9f96b4ebd6023a9f42b3225b3`. PR #32 merged to `main` as `149cb27d16bd0e5f2a7aa599451a25d32a24491f`; the canonical production frontend deploy completed successfully, production health/readiness and homepage checks passed, and the operator confirmed the 1440×900 release-specific `/specialists` UX smoke. The remaining 375×667 vertical-density limitation is accepted as non-blocking and tracked separately in KAN-131; it does not change KAN-130 release status.

After a future staging PASS, add or update a ticket row immediately, record
its actual acceptance time and named decision owner, then decide PROMOTE or
DEFER. Surface unresolved lag after 24 hours; after 72 hours a documented
promotion or valid deferral is required. A merged PR is not `RELEASED` until
the production deploy and runtime evidence are recorded. Jira should link to
this register and carry the supporting delivery evidence.
