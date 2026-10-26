# KAN-158 design synchronization: v6.9.1 candidate (NOT ACTIVE)

> **Activated 2026-10-26** as a scoped overlay in [`SNAPSHOT_CURRENT.json`](SNAPSHOT_CURRENT.json); see the [changelog](CHANGELOG.md) and the [acceptance matrix](IMPLEMENTATION_MATRIX_V691_KAN158.json). The text below records the state at registration (#81) and is kept unchanged.

| Field | Value |
| --- | --- |
| Candidate | `claude-design-2026-10-26-1dbb9008` |
| SHA-256 | `1dbb900845f830cc5fb9833d08f97c173f4500b05155faa00e12f723dabe152d` |
| Archive label | **v6.9.1-candidate** |
| Source date / import date | 2026-10-26 / 2026-10-26 |
| Base | `origin/dev` `535940ffeedb108038992e93cd2cb27c0aa916be`, after #76, #77, #78, #79 and #80 |

**Not activated.** [`SNAPSHOT_CURRENT.json`](SNAPSHOT_CURRENT.json) still points to `claude-design-2026-10-23-4ff7cedd` (v6.6). Activation is a separate decision: see the [activation proposal](SNAPSHOT_ACTIVATION_PROPOSAL_V691.md).

## Provenance

Original archive: `C:/Users/admin/dev/portfolio/consult/design-sources/Модернізація дизайну сайту ProConsult (v6.9.1).zip`. It is 5,171,139 bytes and holds 21 payloads under `proconsult-kan158-phase2-v6.9.1-candidate/`:
- 4 Markdown files;
- 2 offline HTML boards;
- 15 PNG screenshots.

Integrity and path checks:
- CRC check passes;
- no absolute, drive, traversal or backslash paths;
- no case aliases, symlinks or encryption.

Repository files:
- [Exact archive copy](snapshots/2026-10-26-1dbb9008/source.zip) and [frozen package](snapshots/2026-10-26-1dbb9008/README.md).
- [Manifest](SNAPSHOT_MANIFEST_V691_CANDIDATE.json), [coverage matrix](IMPLEMENTATION_MATRIX_V691_KAN158.json) and [validator](validation/validate_v691_candidate.py).

Normalization: line 26 of each HTML board is a blank line of trailing ASCII spaces, and the spaces are stripped. Every other payload is byte-exact. The original bytes stay in `source.zip`. No source wording, status or chronology is corrected.

The source labels itself `PENDING REVIEW (не DESIGN READY, не APPROVED)`. The product owner approved this candidate for KAN-158 phase 2 implementation. That approval sits outside the archive and is recorded here and in the evidence of #76–#80. It does not rewrite the source status.

## Scope

The package covers only two areas:
- **the UI v2 public specialist profile** (desktop, tablet, phone);
- **the profile-editor short-description limit.**

It is a scoped overlay on v6.6, not a full UI v2 handoff. It does not supersede any other v6.6 screen, and this sync does not claim that UI v2 as a whole matches v6.9.1.

| v6.6 reference (active) | v6.9.1 reference (candidate) | Overlay scope |
| --- | --- | --- |
| [Specialist-Profile.dc.html](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile.dc.html) | [Specialist-Profile-Phase2-v6.9.1.html](snapshots/2026-10-26-1dbb9008/proconsult-kan158-phase2-v6.9.1-candidate/Specialist-Profile-Phase2-v6.9.1.html) | Desktop and tablet profile: sections D1, T768/T820, T1 |
| [Specialist-Profile-Mobile.dc.html](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Specialist-Profile-Mobile.dc.html) | Same board, sections M1–M4 | Phone profile |
| [Profile-Edit.dc.html](snapshots/2026-10-23-4ff7cedd/handoff/mockups/Profile-Edit.dc.html) | [Profile-Edit-summary-limit-160.html](snapshots/2026-10-26-1dbb9008/proconsult-kan158-phase2-v6.9.1-candidate/Profile-Edit-summary-limit-160.html) | Short-description field only; the rest of the editor stays on v6.6 |

Unavailable comparisons:
- The source names handoff v6.8 (Specialist Profile 2.1) and v6.9-candidate as predecessors, but neither was supplied.
- The comparison is v6.6 → v6.9.1 directly.
- The intermediate chronology comes only from the source `CHANGELOG.md` and is not inferred further.

## Changes from v6.6 to v6.9.1 in KAN-158

Sources:
- source `CHANGELOG.md` (v6.9 and v6.9.1 entries);
- `IMPLEMENTATION_SPEC.md` and `PRODUCT_DECISIONS.md`;
- a text-marker comparison of the v6.6 and v6.9.1 boards. The boards were read as data and never executed.

| Area | v6.6 | v6.9.1 candidate |
| --- | --- | --- |
| Offer selection | Formats with prices (1 400 / 500 / 2 000 грн in the board data); no explicit initial-selection rule found | **No automatic selection.** «від <мін.>» in the panel, sticky bar and final CTA until an explicit choice; afterwards the chosen price everywhere. |
| Booking panel | Desktop request rail; a single request form | BookingPanel with formats, days and slots, plus the timezone label. Without time: «Обрати час», which leads to the slots. With time: an intermediate «Продовжити · <дата>». |
| Contacts | Public contacts and reply channels within the profile composition (v6.6 matrix); no separate card | Separate **ExternalContactsCard** («Написати напряму · поза Pro Consult»), outside the booking panel. |
| Final CTA | Request-led closing block | Navy block with one primary action and text secondaries; «N формати · від …» plus «Обрати формат». |
| Phone | <860px bottom bar and native request sheet | **MobileStickyBar** below 768px with a context line and headline per mode (6 states). The page reserves bottom space so the footer is never covered (M4). |
| Tablet | Not specified separately | **768–1099:** one column, inline panel, hero photo 180×225 / 200×250. No sticky bar. |
| Desktop | Two-column composition | **≥1100:** 1280 container; grid `minmax(0,1fr) 400px`, gap 48; sticky panel top 96. |
| Timezone | No timezone label of this kind in the boards | One label for the actual slot timezone: «Час за Києвом» or «Ваш місцевий час · <IANA>». No offset and no switcher. |
| Short description | No limit or counter in the boards (runtime previously clamped the hero text) | Full text, no line-clamp. The editor shows «N / 160» and allows at most 160 characters for new or changed text; longer legacy text is kept. |
| Hidden until data or API exists | — | FAQ, «Досвід», «Мови», video duration. |
| Photo | Photo assumed | Initials fallback. |
| Unchanged in the source (CHANGELOG «Без змін») | — | Brand, colours, Onest, radii, section order, «Поділитися профілем» under the photo, video card, «Про мене» dialog, request form, booking modes and their logic, contact visibility rules, the Phase 1 request_only fix. |

## Implementation coverage (#76, #77, #78, #79, #80)

The full row list with notes is in [IMPLEMENTATION_MATRIX_V691_KAN158.json](IMPLEMENTATION_MATRIX_V691_KAN158.json). The table below is its summary.

| PR | Merge | Scope | Evidence |
| --- | --- | --- | --- |
| #76 | `041a705` | PR A: visual layer (contacts card, photo fallback, timezone label, sticky bar, final CTA, full description) | [phase2-pr-a](evidence/kan-158/phase2-pr-a/README.md) |
| #78 | `ade6ca6` | PR B: offer selection and pricing | [phase2-pr-b](evidence/kan-158/phase2-pr-b/README.md) |
| #77 | `c1a77a3` | PR D: short-description limit 160 | [summary-160](evidence/kan-158/summary-160/README.md) |
| #79 | `15505c4` | PR C: breakpoints, separate contacts card, hero sizes | [phase2-pr-c](evidence/kan-158/phase2-pr-c/README.md) |
| #80 | `535940f` | Compact external contacts list | [compact-contacts](evidence/kan-158/compact-contacts/README.md) |

### Implemented

- No offer preselection.
- «від» before a choice and the chosen price after it.
- Active «Обрати час».
- Mode texts.
- Timezone label.
- Final CTA.
- Photo fallback.
- Full short description.
- Hero sizes.

### Implemented with recorded runtime differences

Each of these differences is recorded in the evidence of a merged PR.

1. **No «Продовжити» step and no two-line format + time summary.** A slot click opens the existing request form directly, as the booking contract requires (#78, #79).
2. **Price-first sticky context without bookable time** («<ціна> · <формат>»), so the price is not truncated on 375px phones (#78).
3. **Compact contacts list.** One tinted card with separators replaces per-row tinted 44px rows. Copy targets stay ≥44px and values wrap in full (#80).
4. **Body clearance under the sticky bar** equals the measured bar height, without the design's +24px reserve. The footer clearance was verified in the browser (#76).
5. **Breakpoints:** the existing 860px `compactProfile` stays for FAQ/native share. At viewport heights ≤700px the rail becomes static. Real calendar controls may extend below the first tablet viewport (#79).
6. **Summary limit:**
   - no native `maxlength`, so pasted text is never silently truncated;
   - Unicode code points are counted;
   - unchanged legacy text is allowed and omitted from PATCH;
   - there is no orange counter state after 140;
   - the backend `max_length` stays 240, so the limit is enforced by the editor only (#77).

### Open items: must not be presented as ready

- **NOT IMPLEMENTED:** the final CTA's «Обрати формат» link and «Змінити» → focus on the BookingPanel.
- **OPEN DIFFERENCE:** the design asks for consultation formats as a `radiogroup`. Runtime uses toggle buttons with `aria-pressed` in `PublicProfileIdentityRail.vue`; `role=radiogroup` exists only for the online/offline session-format choice. A decision is needed.
- **CONTRACT RESOLVED DIFFERENCE:** the design hid «Досвід» and «Мови» until they were confirmed in the API. The public API already returns `experience_years` and `languages`, and runtime shows them when present. The design side needs to acknowledge this.
- **NOT RE-AUDITED:**
  - component token values (panel, format, slot, button and final CTA sizes);
  - SectionNav;
  - focus and motion values.

  This documentation task did not measure them. They belong to the separate UX audit.

### Correctly absent

- **No data, so nothing rendered:** FAQ without data and video duration.
- **Concept only:** the timezone switcher and the Kyiv offset.
- **Not approved, so absent:** anonymous questions, SLA, structured education, payment, semantic search, and changes to booking, contact-visibility, header or UI v1 logic.

## Boundaries preserved

This branch makes no runtime changes:
- no changes to `src/`, `public/`, configuration, tests, the backend or the API;
- no changes to an existing snapshot, manifest, matrix or pointer.

Every existing canonical document is unchanged. The candidate is registered only through new files, so nothing activates it by accident.

The UI v1 default, the approved fennec branding, backend/product contracts and the copy rules all remain in force. Copy must not imply that Pro Consult verifies, certifies, ranks, endorses or guarantees specialists.

## Validation

`python -I docs/ui-v2/validation/validate_v691_candidate.py` checks:
- **Archive:** SHA-256, CRC and paths.
- **Payloads:** every payload's source and imported hashes, with the exact whitespace normalization.
- **Coverage matrix:** structure and status vocabulary.
- **Files:**
  - every listed PR evidence file and every Markdown link in the new documents exists;
  - existing snapshots are byte-identical to the base;
  - no file outside `docs/ui-v2/` changed and none was deleted;
  - `SNAPSHOT_CURRENT.json` is unchanged.

Ordinary `git diff --check` must pass.
