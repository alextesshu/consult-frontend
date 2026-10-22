# UI v2 — Design Sync checklist

Before every future implementation task:

- [ ] Read AGENTS.md, Master TZ, current sync audit and the exact page mockup from the selected Claude snapshot.
- [ ] State snapshot ID, archive filename/source, ingestion date and full SHA-256 in the task evidence and PR. Current: `claude-design-2026-10-23-265f221a`, hash `265f221a95ac9fc521a33138b06376b51ad4a822c79fd05e30f7303ef6b10948`.
- [ ] Select the explicitly supplied archive from `C:\Users\admin\dev\portfolio\consult\design-sources`; date-named future exports do not automatically update repo references. Resolve ambiguous selection before importing.
- [ ] Verify checksum and manifest; do not equate a snapshot with the live Claude project.
- [ ] Compare the page with current origin/dev AND relevant unmerged PR heads. Record differences without changing those branches/states.
- [ ] Use this ZIP for UX/UI intent; record accessibility/security/contract conflicts as findings instead of silently redesigning.
- [ ] Map every control/copy claim to actual data, roles and existing APIs. Demo behavior/data is not backend evidence.
- [ ] Resolve applicable [B1–B14/C1–C8 gates](DESIGN_SYNC_2026-10-23.md). Further Client Dashboard remains HOLD until UX approval and contract verification.
- [ ] Separate visual and behavior work; identify exact file scope, v1 isolation, default-v1 rollback and acceptance tests before editing.
- [ ] Preserve query/storage/env precedence, independent storage-failure handling, reactive successful-navigation sync, auth/verification/permissions and real product terms.
- [ ] Never import reference scripts/CDNs/dependencies or copy source CSS/TypeScript blindly into runtime. Brand references are not approval to replace production logos.
- [ ] Validate focused functional/CSS tests, build/typecheck baseline, browser states/keyboard/reduced-motion/overflow, and v1 parity appropriate to the authorized change. Distinguish fixtures from real integration.
- [ ] For future exports, extract safely without modifying the archive; preserve earlier snapshot provenance, hash imports, validate links/assets and record intentional script exclusions.
- [ ] Follow explicit Git authorization; one scoped PR when requested. CI, Ready, merge and deployments retain their separate gates; no manual reruns by inference.

See [current audit and roadmap](DESIGN_SYNC_2026-10-23.md), [manifest](SNAPSHOT_MANIFEST.json) and [reference index](README.md).
