# Consult Frontend Repository Instructions

## Repository role

This repository is the frontend of the Consult project.

Preserve:

- current UX patterns,

- routing behavior,

- state flow,

- naming consistency,

- API contract alignment.

## Product constraints

Consult is a technical service for organizing consultations.

It does not verify, certify, rank, endorse, or guarantee specialists.

Specialists upload their own information and documents.

Clients independently evaluate and choose specialists.

Do not introduce UI copy that implies platform verification, recommendation authority, or guaranteed specialist quality.

## Required repository docs

Before making non-trivial UI changes, inspect relevant docs in `docs/` when applicable.

Priority references:

- `docs/UI\_SHAPE\_STANDARD.md`
- `docs/HANDOFF.md`

If the task affects shared layout, forms, profile presentation, landing structure, or dashboard UX, inspect the relevant UI guidance first.

## Workflow

- Inspect current implementation before proposing changes.

- Provide a short execution plan before editing.

- List exact files before making edits.

- Prefer minimal diffs.

- Change one focused UI slice at a time.

- Do not perform broad redesign unless explicitly requested.

- Do not modify unrelated views, stores, composables, or shared components without necessity.

## UI discipline

- Reuse existing components, stores, composables, and patterns.

- Keep loading, empty, success, and error states explicit.

- Preserve visual consistency unless the task explicitly requires redesign.

- Do not introduce duplicated state logic.

- Do not introduce inconsistent naming or ad-hoc UI behavior.

## API discipline

- Do not invent API fields.

- Inspect existing API usage before changing integration.

- If backend behavior is uncertain, state the assumption clearly.

- If API usage changes, explicitly list:

&nbsp; 1. affected endpoint,

&nbsp; 2. affected fields,

&nbsp; 3. UI impact,

&nbsp; 4. compatibility risks.

## Validation

- Run the smallest relevant checks available in the repository.

- Use the actual package manager and actual scripts from the repository.

- Never claim build, lint, or test success unless it was actually run.

## Output requirements

After each completed task, always provide:

1. what changed,

2. exact changed files,

3. how to verify in UI,

4. risks, follow-up, or remaining work.

## Handoff format

When asked for a handoff, use:

- Context

- Done

- Changed files

- Validation

- Remaining work

- Risks / open questions
