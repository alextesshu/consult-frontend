# Handoff Rules

Purpose:
- Keep frontend handoff governance aligned with backend discipline while preserving the canonical frontend file name.

Canonical files:
- Current-state snapshot: `docs/HANDOFF.md`
- Closed-phase archive: `docs/PHASE_CLOSE_SUMMARIES.md`

## 1) What `docs/HANDOFF.md` is

- `docs/HANDOFF.md` is the canonical frontend handoff file.
- It must stay compact and represent only the current project state.
- It is not a changelog and should not accumulate long historical task history.

Required sections in `docs/HANDOFF.md`:
- Current Phase
- System State
- Stable Areas
- Active Work
- Immediate Next Step
- Critical Rules

## 2) Update triggers

Update `docs/HANDOFF.md` when:
- a phase is closed,
- a major refactor lands,
- the active work direction or immediate next step changes,
- critical runtime rules/assumptions change.

Do not rewrite `docs/HANDOFF.md` for every micro-task if current state did not change.

## 3) What belongs in phase summaries

`docs/PHASE_CLOSE_SUMMARIES.md` is append-only historical archive for closed phases.

Each phase entry should be brief and operational:
- Context
- Done
- Validation
- Deferred / Not in Scope
- Key Commits
- Merge Readiness (when applicable)

## 4) Coordination notes

- Keep `README.md` and `docs/HANDOFF.md` consistent on canonical handoff references.
- Prefer small, factual updates over broad documentation rewrites.
