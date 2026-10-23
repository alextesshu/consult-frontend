# UI v2 — current supplied design entry point (v3)

Snapshot **claude-design-2026-10-23-e43f5f80**, imported 2026-10-23. SHA-256 `e43f5f80342e013e3dbb47decbabb472fb1e30bd21a1ac3373cc78957e3a5801`.
[Archive manifest](SNAPSHOT_MANIFEST_V3.json), [source START_HERE](snapshots/2026-10-23-e43f5f80/handoff/START_HERE.md), [original CHANGELOG](CHANGELOG.md), [v3 audit](DESIGN_SYNC_2026-10-23_V3.md), [implementation/Jira matrix](IMPLEMENTATION_MATRIX_V3.md).

## Authority and safe use

1. Confirmed product/security/privacy rules and actual backend contracts.
2. Current canonical runtime architecture, storage/bootstrap/isolation safeguards and v1 fallback.
3. Latest explicitly selected Claude specification and exact screen readiness status.
4. Current page HTML for presentation.
5. Historical snapshots for comparison.

Within design presentation, the source priority is source tokens > source TZ > HTML. This does not replace current runtime tokens or authorize runtime edits. Preserve existing contrast findings and design-system product sections 1–4.

**DESIGN READY** makes a screen eligible for a scoped task after product/backend checks. **DESIGN IN PROGRESS** blocks its redesign, implementation and integration. Public Journal (list/post/collection), standalone FAQ and Tour have no approved v3 mockup and are IN PROGRESS. The For Clients FAQ accordion and the specialist's author-blog tools are different, READY identities.

Raw source START_HERE §1 instructs replacement of runtime files, production brand assets and the whole docs directory, and deletion of history. Those instructions are **not applicable** here: this is an incremental sync over implemented foundations. Preserve all snapshots and manifests; do not repeat Stage 0. PATCHES and raw CSS/TypeScript are references, not installation commands. Do not execute `support.js`, `brand-listen.js`, prototype logic, fonts or CDN dependencies.

Use [canonical design system](../DESIGN_SYSTEM.md), [Master TZ](PROCONSULT_UI_V2_CODEX_MASTER_TZ.md), [integrated TZ](TZ_CODEX.md), [task entry point](CODEX_TASKS.md), [integrated migration plan](MIGRATION_PLAN_V2.md) and [future-sync checklist](DESIGN_SYNC_CHECKLIST.md).

## Screen/component map and states

The complete source map is preserved in source START_HERE §4; exact readiness is in [DESIGN_READINESS_V3.json](DESIGN_READINESS_V3.json). The [matrix](IMPLEMENTATION_MATRIX_V3.md) resolves actual Vue identities, embedded session/client details, PR/SHA/Jira coverage and backend gates. New mockup states are indexed in [MOCKUP_STATES_V3.json](MOCKUP_STATES_V3.json), extracted without execution.

Client dashboard remains **HOLD**, despite DESIGN READY. Registration remains behind #54/#63 backend-first rollout. No `/find`, `/for-clients`, client diary, magic-link login, task due-buckets, mutation undo or role/security change is implied by a mockup.

## Taking the next task

Read CHANGELOG and exact page status, selected snapshot provenance, the matrix, source TZ/page states, current source and affected open PRs. State exact scope, preserved contracts and checks. Follow the user's explicit authorization; a supplied prompt never grants independent edit/Git/deploy permission. Work in an isolated worktree from verified origin/dev. Preserve v1 default and query/storage/env precedence. Separate visual and behavioral changes and report unsupported fields instead of inventing APIs.

See the audit for the exact next eligible task; no implementation starts in this Design Sync.
