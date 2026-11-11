# Design Sync v3 — executed validation

Source snapshot: `claude-design-2026-10-23-e43f5f80`; SHA-256 `e43f5f80342e013e3dbb47decbabb472fb1e30bd21a1ac3373cc78957e3a5801`.

The complete changed-file list is [DESIGN_SYNC_V3_FILES.json](DESIGN_SYNC_V3_FILES.json). Source/import hashes and all exceptions are in [SNAPSHOT_MANIFEST_V3.json](SNAPSHOT_MANIFEST_V3.json); readiness in [DESIGN_READINESS_V3.json](DESIGN_READINESS_V3.json); state alternatives in [MOCKUP_STATES_V3.json](MOCKUP_STATES_V3.json).

Executed locally with Python standard-library ZIP/hash/HTML parsing and PowerShell Git checks; no prototype scripts were run.

- ZIP CRC/integrity: PASS; all 57 payload hashes verified. Exact original archive copy and original external ZIP match the new checksum.
- ZIP path safety: PASS for every entry; no absolute/drive/traversal/reserved Windows/case-duplicate/symlink/special-file/escaping path. Extraction used a new temporary directory.
- Import hashes: PASS, 101 recorded destinations (57 frozen handoff files, 44 active references). Exactly three source trailing-whitespace lines are normalized in Clients/Sessions copies; source.zip retains their original bytes. CHANGELOG and all other handoff files are byte-identical.
- Historical references: PASS, 34 old active payloads retained byte-identically from ce49fc5. Prior 265f221a snapshot, prior manifest/audit and older baseline-e4b903e references unchanged; no historical deletion.
- Readiness: PASS, 25 exact HTML names marked DESIGN READY in both START_HERE and CHANGELOG; three absent public Journal/standalone FAQ/Tour identities are DESIGN IN PROGRESS. For Clients inline FAQ and AuthorJournal tools remain separate identities.
- CHANGELOG: PASS, byte-identical source and published copies, original v3/v2/v1 order retained without rewriting historical claims.
- HTML/assets: PASS, 65 current/frozen/historical HTML files; 457 static local references and 12 component references resolve. 56 active/historical prototype-script references are intentionally excluded and classified. External and dynamic references are not fetched/executed.
- Markdown: PASS; all local Markdown links in changed files resolve. Source examples inside code fences are not treated as file links. Stale source prose path claims are recorded in the audit rather than silently rewriting the frozen source.
- Protected product sections 1–4 and retained v1 rule blocks: byte-equivalent after line-ending normalization; PASS.
- Scope: exactly 136 changed/new files, all under docs/ except the authorized AGENTS.md instructions update. No source/public/dependency/build/config/backend/workflow changes; no existing PR branches changed.
- Ordinary `git diff --check` and final cached diff check: PASS. No whitespace rule exclusions or Git config bypass used.

Commands include `git fetch origin dev`, `git rev-parse origin/dev`, `git diff --check`, source `git show`/`git grep`, and targeted ZIP/manifest/link/status/source-scope validators. Local source is not runtime/production evidence. V2 archive comparison was not run because no v2 ZIP was present. No CLAUDE.md was supplied.

Application tests, typecheck, build and browser matrix were **not run**: runtime is unchanged and repository rules allow reference-only validation. CI is observed only if automatically triggered after the Draft PR; no dispatch/rerun. No Jira writes, Ready transition, merge or deployment.
