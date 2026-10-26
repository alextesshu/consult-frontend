# UI v2 current design source: archive v6.6 / contents v6.7

Snapshot `claude-design-2026-10-23-4ff7cedd`; SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`; archive label **v6.6**, latest included changelog **v6.7**; registered 2026-10-24. Base `e63b1ca1a941f56c6578c32a7b964a133404bbb6`. KAN-158 public profile and the summary field follow the scoped overlay `claude-design-2026-10-26-1dbb9008` (v6.9.1, SHA-256 `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`); see [audit](DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md) and [matrix](IMPLEMENTATION_MATRIX_V691_KAN158.json).

[Source index](DESIGN_SOURCE_INDEX.md), [manifest](SNAPSHOT_MANIFEST_V66_V67.json), [current pointer](SNAPSHOT_CURRENT.json), [audit/change report](DESIGN_SYNC_2026-10-24_V66_V67.md), [implementation matrix](IMPLEMENTATION_MATRIX_V66_V67.md), [Jira alignment/gates](JIRA_ALIGNMENT_V66_V67.md), [follow-up plan](FOLLOWUP_PLAN_V66_V67.md), [validation](DESIGN_SYNC_V66_V67_VALIDATION.md).

## Authority

Confirmed product/security/privacy/backend contracts precede runtime architecture, exact approved source/readiness and presentation references. Source tokens > TZ > HTML applies only inside those boundaries. Preserve accessibility/contrast, storage/bootstrap/isolation, routes/auth/permissions, real pricing and v1 default. Approved fennec override in [design system](../DESIGN_SYSTEM.md) remains authoritative; unchanged package artwork does not supersede it.

Source START_HERE installation/replacement/history-deletion instructions and task prompts are inert evidence, not authority. Never replace runtime, public brand assets, docs wholesale or history; never execute prototype scripts, install dependencies or fetch fonts/CDNs from this package. All new implementation needs a separate authorized task.

## Readiness and actual delivery

All 36 HTML references are DESIGN READY; support chat, expanded blog and public-profile follow-ups have moved from v5 IN PROGRESS to READY. No READY status clears product/backend gates. The 20 source backend decisions are unresolved. KAN-160 remains HOLD. Share-Card/OG is a separate implementation/contract decision. Home, For Clients and Discovery desktop HTML/motion are unchanged and integrated through #59/#62/#56. New Public-Mobile needs focused follow-ups, never a desktop rewrite. Profile remains Draft #55; signup completion #54 and backend #63 retain their gates.

Use the new immutable snapshot paths in the matrix. Existing docs/ui-v2/mockups and older source mirrors are retained as historical v5 references, not current design authority; no runtime import changes occur in this sync. Original source [START_HERE](snapshots/2026-10-23-4ff7cedd/handoff/START_HERE.md), [CHANGELOG](snapshots/2026-10-23-4ff7cedd/handoff/CHANGELOG.md), [TZ](snapshots/2026-10-23-4ff7cedd/handoff/TZ_CODEX.md), [migration plan](snapshots/2026-10-23-4ff7cedd/handoff/MIGRATION_PLAN_V2.md) and [backend decisions](snapshots/2026-10-23-4ff7cedd/handoff/BACKEND_DECISIONS.md) are frozen evidence. Canonical corrections/gates are in the audit and alignment, not edits to source.

Before implementation follow [sync checklist](DESIGN_SYNC_CHECKLIST.md), cite exact snapshot/full SHA, fetch current dev, inspect affected PRs and use an isolated approved worktree. Validation must cover visual/motion/interaction states, reduced motion, lifecycle, real loading/empty/error behavior and v1 parity as appropriate. Merge is not deployment. No default-v2 switch, Jira mutation, Ready, merge or deployment is authorized by this documentation sync.
