# UI v2 — canonical task entry point (v5)

Snapshot: `claude-design-2026-10-23-7570f1ad`; archive SHA-256 `7570f1ad67c93020ad2df6889c5b3e7fd671e8146b8d4fbe37b4bfa626fe0caf`.
Start with [START_HERE](START_HERE.md), [CHANGELOG](CHANGELOG.md), [matrix](IMPLEMENTATION_MATRIX_V5.md), [audit](DESIGN_SYNC_2026-10-23_V5.md) and [checklist](DESIGN_SYNC_CHECKLIST.md).

The [exact Claude prompts](snapshots/2026-10-23-7570f1ad/handoff/CODEX_TASKS.md) are preserved as supplied. They are not standalone execution authorization. Runtime file replacement, history deletion, default-v2 rollout and deployment instructions from source START_HERE/PATCHES must not be executed by a documentation sync.

- Check exact screen identity and readiness before planning: IN PROGRESS blocks implementation/integration; READY still requires actual backend/product evidence.
- Use confirmed product/security/privacy rules and current runtime architecture before design intent. Preserve v1, hardened UI version/storage/bootstrap handling, permissions and real pricing.
- Keep original `password_confirm` signup and `new_password_confirm` reset contracts until separately approved. Source prompt `password_confirmation` is not the API field. #54/#63 remain Draft.
- Read source TZ and all page states; never copy mock data or prototype JavaScript or infer endpoints. Do not add semantic/AI claims, nearest-slot data, SLA or 24-hour cancellation claims without contracts. Carry forward KAN-163; only new v5 requirements are assessed in this audit.
- Preserve existing routes and working navigation. `/find`, `topic`, `/for-clients`, magic-link login, client diary and real undo are not available merely because a prototype links them.
- Cite snapshot ID, full archive checksum, Git base, source page/status, exact file scope and focused acceptance evidence in every implementation/PR.
- Follow explicit user authorization for local changes and Git operations; never mutate pending PR branches, Jira, Ready state, merge or deployment by inference.

[Source map](snapshots/2026-10-23-7570f1ad/handoff/START_HERE.md) and [integrated plan](MIGRATION_PLAN_V2.md) cover stages 0–11. Client dashboard remains HOLD; no duplicate Home, signup, discovery or profile work. Do not apply source statements that all “other pages” lack mockups to the new READY coverage. Public Journal/FAQ are READY under Public-Content; Tour is an existing redirect. Support Chat, Expanded Blog Editor and Public Profile follow-up remain IN PROGRESS; current editor/profile references remain READY.

Stage 11 is a separately scoped backend email task: no templates/sends in this frontend reference sync. support@proconsult.space is approved copy, not mailbox-operation evidence. Psychological support uses the existing discovery landing; topic chips must map to real filters, not be invented.
