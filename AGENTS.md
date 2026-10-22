# Consult Frontend Repository Instructions

## Workflow

- Reply to the user in Ukrainian unless another language is requested.
- Run local commands in Windows PowerShell.
- Work on branch `dev` unless explicitly agreed otherwise.
- Do not create feature branches without explicit approval.
- Do not commit, push, merge, or deploy without a direct request.
- Run production deploys only after explicit confirmation.
- GitHub connector may be used for read-only inspection, PR/CI review, and repository metadata without separate permission.
- Do not use the GitHub connector to create commits or modify repository files unless explicitly authorized for that write.
- Prefer a local/Codex workspace for implementation so changes can be tested before commit.
- Do not remind the user to run `npm run dev`; the local dev server is usually already running.
- Inspect repository state before editing.
- Provide a short plan and list exact files before editing.
- Do not modify unrelated files.
- Do not erase, reset, stash, or overwrite unfamiliar local changes.

## Frontend Boundaries

- Stack: Vue 3, TypeScript, Vite, Pinia, Vue Router, Vitest.
- Reuse existing components, stores, composables, and design tokens before creating new ones.
- Preserve routing behavior, state flow, accessibility, and API contract alignment.
- Do not invent API fields or backend behavior.
- UX copy must follow canonical product terminology and must not imply Pro Consult verifies, certifies, ranks, endorses, or guarantees specialists.
- Add or update regression tests for behavior changes.
- Do not change build or deploy configuration without a direct need.

## Canonical Documentation

- Frontend handoff: `docs/HANDOFF.md`
- Handoff governance: `docs/HANDOFF_RULES.md`
- Design system: `docs/DESIGN_SYSTEM.md`, `docs/UI_SHAPE_STANDARD.md`
- UI v2 migration: `docs/ui-v2/README.md` (opt-in v2 infrastructure, reference mockups, approval gates; default v1)
- Every future UI v2 implementation must identify the exact Claude snapshot ID and full archive SHA-256; follow `docs/ui-v2/DESIGN_SYNC_CHECKLIST.md` and its current audit before editing.
- Product/public profile rules: `docs/PROFILE_PUBLIC_URLS.md`
- Phase archive: `docs/PHASE_CLOSE_SUMMARIES.md`
- Backend API/product contract, when needed: `..\backend\docs\AI_CONTRACT.md`
- Cross-repository workflow policies and Skills:
  `..\backend\docs\GIT_CI_PROMOTION.md`,
  `..\backend\docs\JIRA_DELIVERY_LIFECYCLE.md`, and
  `..\backend\.agents\skills\`

The backend repository Skills are canonical for Pro Consult workflows. Do not
let user-global or cached Skill copies override those repository instructions
or their referenced documentation and scripts.

Read only the relevant canonical docs for the task. Do not duplicate their full content in `AGENTS.md`.

## Validation

- Run the narrowest relevant Vitest tests first.
- Run TypeScript or build checks when the change requires them.
- Run `git diff --check` before final reporting.
- Report exact changed files and exact verification commands.
- Do not report warnings as errors, but document new warnings.
- Do not claim success for checks that were not run.
