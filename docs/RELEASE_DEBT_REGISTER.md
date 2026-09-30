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
      "decision": {"kind": "PROMOTE", "at": null, "reason": null, "next_review_at": null},
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
      "staging": {"sha": null, "acceptance_completed_at": null, "evidence": "Earlier staging SHAs vary by slice."},
      "release_owner": null,
      "decision": {"kind": "PROMOTE", "at": null, "reason": null, "next_review_at": null},
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
      "staging": {"sha": "df8929de7d676374e90a0279021b0dcfdf1b7444", "acceptance_completed_at": null, "evidence": null},
      "release_owner": null,
      "decision": {"kind": null, "at": null, "reason": null, "next_review_at": null},
      "production": {"pr": null, "deployed_source_sha": null, "runtime_evidence": null}
    },
    {
      "id": "kan-105-role-return-route",
      "ticket": "KAN-105",
      "repository": "consult-frontend",
      "status": "MAIN_ONLY",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; the production-only scope requires reconciliation.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {"sha": null, "acceptance_completed_at": null, "evidence": null},
      "release_owner": null,
      "decision": {"kind": null, "at": null, "reason": null, "next_review_at": null},
      "production": {"pr": null, "deployed_source_sha": "9e1856e440ad72c9eaea0eaacb7352e75cc3f461", "runtime_evidence": "Present in production source checkout."}
    },
    {
      "id": "kan-107-posthog-transport-verification",
      "ticket": "KAN-107",
      "repository": "consult-frontend",
      "status": "AMBIGUOUS",
      "historical_evidence": true,
      "historical_reason": "Imported from the reviewed KAN-127 Phase A reconciliation snapshot; live transport evidence was incomplete.",
      "evidence_snapshot_at": "2026-09-29T11:03:00Z",
      "staging": {"sha": "df8929de7d676374e90a0279021b0dcfdf1b7444", "acceptance_completed_at": null, "evidence": "Staging code was accepted; live production transport inspection was not established."},
      "release_owner": null,
      "decision": {"kind": null, "at": null, "reason": null, "next_review_at": null},
      "production": {"pr": "https://github.com/alextesshu/consult-frontend/pull/23", "deployed_source_sha": null, "runtime_evidence": null}
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
