# Frozen Claude package: KAN-158 phase 2 · v6.9.1-candidate (NOT ACTIVE)

| Field | Value |
| --- | --- |
| Snapshot | `claude-design-2026-10-26-1dbb9008` |
| Status | Candidate, **not active**. [`SNAPSHOT_CURRENT.json`](../../SNAPSHOT_CURRENT.json) still points to `claude-design-2026-10-23-4ff7cedd`. |
| Source date | 2026-10-26 |
| Imported | 2026-10-26 |
| SHA-256 | `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d` |

Links:
- [exact original archive](source.zip)
- [source manifest](proconsult-kan158-phase2-v6.9.1-candidate/MANIFEST.md)
- [source changelog](proconsult-kan158-phase2-v6.9.1-candidate/CHANGELOG.md)
- [implementation spec](proconsult-kan158-phase2-v6.9.1-candidate/IMPLEMENTATION_SPEC.md)
- [product decisions](proconsult-kan158-phase2-v6.9.1-candidate/PRODUCT_DECISIONS.md)
- [repository manifest](../../SNAPSHOT_MANIFEST_V691_CANDIDATE.json)
- [audit](../../DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md)

## Scope

This is a scoped package, not a full UI v2 handoff. It covers only:
- the KAN-158 UI v2 public specialist profile;
- the short-description limit in the profile editor.

It is an overlay on `claude-design-2026-10-23-4ff7cedd` (v6.6). Every other UI v2 screen stays on v6.6.

## Contents and normalization

All 21 payload files are present at their exact archive paths.

The original archive and every original payload byte are retained in `source.zip`. The only change is in line 26 of the two HTML files: it is a blank line of trailing ASCII spaces, and the spaces are stripped. The repository manifest records both hashes and the line numbers. There is no other normalization.

Do not edit this snapshot or regenerate it from a later export.

## Status in the source

The source `MANIFEST.md` labels the package `v6.9.1-candidate / PENDING REVIEW`. The product owner approved it for KAN-158 phase 2 implementation outside the archive. That approval is recorded in the [audit](../../DESIGN_SYNC_2026-10-26_V691_CANDIDATE.md) and does not change the source text.

## Inert material

The two HTML boards bundle inline scripts and reference `unpkg.com` and Google Fonts. They are inert evidence: never execute them, install their dependencies or copy their code into the runtime.

The prototype's controls, names, prices and timings are not backend evidence. Backend and product contracts, the UI v1 default and the approved fennec branding take precedence.
