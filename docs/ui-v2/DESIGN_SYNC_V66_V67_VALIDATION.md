# KAN-154 reference synchronization validation

Snapshot `claude-design-2026-10-23-4ff7cedd`; full SHA-256 `4ff7cedd41f829306facd154e0a2af189b2e2cce3af3c786b6e4fb913149a347`. Source date 2026-10-23; validation/import date 2026-10-24. Base `e63b1ca1a941f56c6578c32a7b964a133404bbb6`.

[Reproducible validator](validation/validate_v66_sync.py), [manifest](SNAPSHOT_MANIFEST_V66_V67.json), [exact changed-file inventory](DESIGN_SYNC_V66_V67_FILES.json), [audit and known source defects](DESIGN_SYNC_2026-10-24_V66_V67.md).

## Checks

Run from the isolated worktree in Windows PowerShell:

```powershell
python -X utf8 docs/ui-v2/validation/validate_v66_sync.py
git diff --check
git diff --cached --check
git status --short
git diff --stat
git diff --cached --stat
```

The validator checks CRC and safe ZIP names/types, exact original ZIP, all 70 source/import hashes and normalization equivalence, 8 added/25 modified/37 unchanged/no removals, complete snapshot inventory, all historical snapshot bytes against base, unchanged prior manifest, docs-only scope, strict UTF-8, canonical Markdown paths, static HTML asset/page references, 36-reference readiness/matrix identity, 20 unresolved source decisions, merged PR ancestry and staged Git snapshot bytes. Machine inventory lists every changed path, including itself.

Four original trailing-whitespace lines are normalized only in browsable Clients85/272, Sessions153, Service-Pages57. Exact bytes remain in source.zip; manifest includes both hashes. No whitespace-check configuration bypass. Git EOL policy stays unchanged.

Canonical links are checked in new docs and new supersession notices; retained historical bodies and frozen source Markdown installation examples are not represented as current repository links. Static HTML links resolve except one explicitly documented missing Specialist-Cabinet.dc.html target. Dynamic/external refs and source installation-path examples are not executed/fetched. The erroneous sample /s/guest route is documented, never imported into runtime.

No source scripts/CDNs/dependencies executed, no build/Vitest/typecheck/browser acceptance/live backend/email tests: documentation-only scope. No runtime/public/workflow/dependency/backend edits, previous snapshot deletions, Jira mutations, Ready, merge, deployment or manual CI rerun. CI paths-ignore covers this docs-only PR; skipped CI is not a build/test PASS. Cleanliness, remote branch SHA and Draft PR are rechecked during Git finalization.

Local validator including staged snapshot bytes, ordinary git diff --check and cached git diff --check: PASS on 2026-10-24. A validator-script CRLF staging warning was resolved by writing UTF-8/LF; no attributes or whitespace policy changed. See the PR delivery report for actual commit/remote/CI observations.
