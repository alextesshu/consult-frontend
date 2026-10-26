# Proposal: activate v6.9.1 as a scoped overlay (KAN-158) — NOT APPLIED

Status: **proposal only**. Nothing in this branch changes [`SNAPSHOT_CURRENT.json`](SNAPSHOT_CURRENT.json). Activation is a separate, explicitly approved change made after:
- the Codex UX audit is complete;
- the decisions listed below are taken.

- Candidate: `claude-design-2026-10-26-1dbb9008`, SHA-256 `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d`.
- Docs: [audit](DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md), [manifest](SNAPSHOT_MANIFEST_V691_CANDIDATE.json), [coverage matrix](IMPLEMENTATION_MATRIX_V691_KAN158.json).

## Recommended form: a scoped overlay, not a replacement

v6.9.1 is a 21-file package for one page and one editor field. If it replaced `snapshot_id`, every other UI v2 screen would lose its active reference, and the pointer would wrongly say that UI v2 as a whole follows v6.9.1.

So the base stays `claude-design-2026-10-23-4ff7cedd`, and v6.9.1 is added as a scoped overlay. No script parses `SNAPSHOT_CURRENT.json`: a repository search finds only Markdown links to it. Adding a field therefore breaks no consumer.

Rejected alternative: switching `snapshot_id` to `claude-design-2026-10-26-1dbb9008`. That would orphan the 36 v6.6 references.

## Preconditions

1. The Codex UX audit is complete, and its findings are reflected in the coverage matrix.
2. Each non-final row has a recorded decision:
   - `final-cta-choose-format-link` (**NOT IMPLEMENTED**): implement it in a separate PR, or accept that it is omitted.
   - `accessibility-offers-radiogroup` (**OPEN DIFFERENCE**): accept the toggle-button pattern, or schedule a separate accessibility change.
   - `experience-languages` (**CONTRACT RESOLVED DIFFERENCE**): the design acknowledges that the API provides these fields.
   - The **NOT RE-AUDITED** rows: component tokens, SectionNav, focus and motion values.
3. The six **IMPLEMENTED WITH APPROVED DIFFERENCE** rows are confirmed as the accepted runtime deviations.
4. The user gives explicit approval to activate.

## Exact changes at activation (one documentation PR)

### 1. `docs/ui-v2/SNAPSHOT_CURRENT.json`

The full new content:
- the existing seven fields stay byte-for-byte unchanged;
- one new `scoped_overlays` field is added;
- `<YYYY-MM-DD>` and `<approval reference>` are filled in at activation.

```json
{
  "snapshot_id": "claude-design-2026-10-23-4ff7cedd",
  "manifest": "SNAPSHOT_MANIFEST_V66_V67.json",
  "sha256": "4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347",
  "archive_label": "v6.6",
  "content_changelog_latest": "v6.7",
  "previous_manifest": "SNAPSHOT_MANIFEST_V5.json",
  "scope": "Design documentation only; runtime and active legacy mockup mirror unchanged",
  "scoped_overlays": [
    {
      "snapshot_id": "claude-design-2026-10-26-1dbb9008",
      "manifest": "SNAPSHOT_MANIFEST_V691_CANDIDATE.json",
      "sha256": "1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d",
      "archive_label": "v6.9.1",
      "scope": "KAN-158: UI v2 public specialist profile (Specialist-Profile, Specialist-Profile-Mobile) and the profile-editor short-description field only",
      "supersedes": [
        "snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile.dc.html",
        "snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile-Mobile.dc.html",
        "snapshots/2026-10-23-4ff7cedd/handoff/mockups/Profile-Edit.dc.html#short-description"
      ],
      "matrix": "IMPLEMENTATION_MATRIX_V691_KAN158.json",
      "activated": "<YYYY-MM-DD>",
      "approval": "<approval reference>"
    }
  ]
}
```

### 2. `docs/ui-v2/SNAPSHOT_MANIFEST_V691_CANDIDATE.json`

- `status`: `"CANDIDATE — NOT ACTIVE"` → `"ACTIVE SCOPED OVERLAY"`.
- `activation`: replace with the date, approval reference and pointer path.
- The `files` list and every hash stay unchanged.
- Keep the filename, so that existing links stay valid.

### 3. `docs/ui-v2/IMPLEMENTATION_MATRIX_V691_KAN158.json`

- `status` → `"ACTIVE SCOPED OVERLAY"`.
- Record each decision from precondition 2 in its row.
- Add the Codex audit results to the `NOT RE-AUDITED` rows.

### 4. `docs/ui-v2/DESIGN_SOURCE_INDEX.md`

Insert a row above the v6.6 row:

`| claude-design-2026-10-26-1dbb9008 | v6.9.1 (candidate package, KAN-158 only) | Active scoped overlay for the UI v2 public profile and summary field; v6.6 stays current for every other screen | [Frozen package](snapshots/2026-10-26-1dbb9008/README.md), [manifest](SNAPSHOT_MANIFEST_V691_CANDIDATE.json) |`

### 5. Pointer sentences in canonical documents

Append one overlay sentence after the existing v6.6 snapshot sentence:
- `docs/ui-v2/START_HERE.md` line 3;
- `docs/ui-v2/README.md` line 3;
- `docs/ui-v2/DESIGN_SYNC_CHECKLIST.md` line 3;
- `docs/DESIGN_SYSTEM.md` line 3.

> KAN-158 public profile and the summary field follow the scoped overlay `claude-design-2026-10-26-1dbb9008` (v6.9.1); see [audit](DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md).

Adjust the relative link prefix in `docs/DESIGN_SYSTEM.md` to `ui-v2/`.

### 6. `docs/ui-v2/KAN_158_PUBLIC_PROFILE.md` line 5

Add the overlay ID, SHA-256 and board link after the v6.6 source sentence.

### 7. `docs/ui-v2/IMPLEMENTATION_MATRIX_V66_V67.md` and `.json`

Annotate three rows, keeping the original text:
- `Specialist-Profile.dc.html` (line 42);
- `Specialist-Profile-Mobile.dc.html` (line 43);
- `Profile-Edit.dc.html` (line 32, summary field only).

Annotation: «KAN-158 scope superseded by overlay `claude-design-2026-10-26-1dbb9008`».

### 8. `docs/ui-v2/CHANGELOG.md`

Add a dated `## Canonical reference pointer — <date>` entry above the existing 2026-10-24 entry. It states:
- the overlay and its scope;
- that v6.6 remains the base.

Do not rewrite the source chronology.

### 9. `docs/ui-v2/validation/validate_v691_candidate.py`

Replace the "pointer unchanged" assertion with an assertion that:
- the pointer has exactly this overlay;
- the base fields are unchanged.

## Not part of activation

These stay separate and need their own approval:
- runtime, test, configuration, backend or Jira changes;
- PR state changes;
- any default-v2 change or deployment.

Not changed by activation:
- `AGENTS.md`, which references the v5 readiness documents;
- frozen snapshots and older manifests.

## Activation checks

- `python -I docs/ui-v2/validation/validate_v691_candidate.py` (updated as in step 9).
- `git diff --check`.
- `git diff --name-only origin/dev`: only the documentation files listed above.
- No changes in `src/`, `public/` or configuration.
