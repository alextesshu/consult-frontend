# UI v2 — integrated v3 implementation routing

Current snapshot: `claude-design-2026-10-23-e43f5f80`, SHA-256 `e43f5f80342e013e3dbb47decbabb472fb1e30bd21a1ac3373cc78957e3a5801`.
[Exact source plan](snapshots/2026-10-23-e43f5f80/handoff/MIGRATION_PLAN_V2.md), [readiness](CHANGELOG.md), [matrix](IMPLEMENTATION_MATRIX_V3.md), [audit/next task](DESIGN_SYNC_2026-10-23_V3.md), [canonical migration history](../UI_MIGRATION_PLAN.md).

The source expands coverage to 5a auth, 5b client subpages, 6 chat/inquiries/schedule, 7 profile/billing/settings, 8 specialist tools and 9 guest screens. Step 0 is historical; foundations are implemented. Source “Stage 5 default rollout” is distinct from 5a/5b screen IDs and remains separately authorized. Its proposed calendar/rollout duration never authorizes deployment.

Only DESIGN READY screens can enter scoped implementation, subject to contracts and explicit authorization. Public Journal, standalone FAQ and Tour remain DESIGN IN PROGRESS. The source footer's generic “other pages without mockups” statement is superseded for explicitly mapped v3 pages, not authority to redesign an unfinished screen.

1. Review this sync and preserve #54–#57/#59/#63. #59 already addresses the unchanged Home reference: no duplicate homepage implementation.
2. Next eligible development candidate: **KAN-158, public header/footer v2 brand visuals only** in App.vue plus separately named v2 assets and focused tests. Home/Brand are DESIGN READY and unchanged. Retain every working destination; do not add missing `/for-clients`, overwrite v1 logos or change authenticated/minimal shells. Exclude HomeView (#59 owns it) and public-profile logic (#55 owns it). Perform the exact scope preflight in that task.
3. KAN-156 For Clients: READY, but implementation must first resolve approved copy/crisis information and safe existing-route query handoff. Do not automatically launch it from the old roadmap. Its inline FAQ is not the unfinished standalone FAQ.
4. KAN-157: reassess #56 against unchanged Find-Specialist. Separate visual acceptance from 600ms search, topic mapping and nearest-slot contracts; do not duplicate its branch.
5. KAN-159: retain #54/#63 backend-first gates; source numeric PCListen bindings are prototype compatibility changes, not new registration API requirements.
6. KAN-161: split each READY cabinet/auth/client-subpage/tool/guest screen into focused visual and behavioral tasks after DTO/permission mapping; do not start Stage 4 merely by plan order. New diary, magic login, due-buckets and guest-group preview require separate approved contracts.
7. KAN-160 remains HOLD until updated UX and relevant KAN-163 gates are accepted. DESIGN READY is not product/backend readiness.
8. KAN-162 handles cross-page integration/rollout only after accepted changes; preserve v1/default flags and separate Ready/merge/deploy gates.

This order is a documented recommendation, not implementation or Jira mutation authorization.
