# Public profile share UX

Base: `9a46d8e602eb50e21962281e65bfda9f2c264f6a`.
Reuses the existing KAN-158 UI v2 share overlay and styling, without modifying
Claude snapshots, Header07, Footer, booking logic, routing or auth architecture.

## Entry points and root cause

- `PublicProfileView`: one share handler serves the public hero at desktop and
  compact widths. Below860px it previously awaited `navigator.share()` before
  opening its own UI, making Windows/native share the default when supported.
- `TherapistProfileView`: cabinet summary share action and the separate copy-link
  callout. Publication/ownership gates and persisted slug resolution are retained.
- Both profile views previously composed share URLs with `window.location.origin`,
  leaking local/staging links. A small canonical helper now builds only
  `https://proconsult.space/s/<persisted canonical slug>` and encodes its path.
  The cabinet copy callout uses the same origin-independent helper.
- The article `ShareDialog` and review-card sharing are separate flows and are
  unchanged. UI v1 keeps its existing share dialog. Its only deliberate shared
  correction is production-canonical profile share/copy URLs and the corresponding
  displayed copy URL. Local profile preview/open links and metadata behavior stay
  unchanged; they are not social share targets.

## Platform behavior

| Action | Behavior |
| --- | --- |
| Telegram | `https://t.me/share/url` with separately encoded `url` and `text`. |
| Facebook | Existing standalone `https://www.facebook.com/sharer/sharer.php?u=...`; opens Meta's share chooser. No SDK/app credentials added. |
| Threads | Current `https://www.threads.com/intent/post` with `text` and `url`. The always-available Copy Link remains the explicit fallback if Threads/login does not open. |
| Instagram | Clearly labeled copy action, then an explicit Open Instagram link; never a fabricated direct-post URL. On copy failure, manual URL selection remains available. |
| Copy Link | Clipboard API, then a textarea inside the native modal, then a labeled readonly manual URL on failure. Success is announced only after an actual successful copy result. |

All destinations require the user's own confirmation in the social platform;
clicking a share choice does not publish a post. External links use `_blank`
and `noopener noreferrer`; no social SDK is loaded. Late clipboard completions
cannot update closed/replaced-profile feedback. Focus is restored after the DOM
fallback. The existing native modal retains Escape, focus containment/restoration,
body scroll lock, reduced motion and mobile presentation.

Provider verification on2026-11-07:

- [Telegram official custom share URL](https://core.telegram.org/widgets/share).
- [Meta Threads Web Intents](https://developers.facebook.com/documentation/threads/threads-web-intents): direct GET returned200; current `.com/intent/post` and both `text`/`url` parameters verified in the first-party documentation. Logged-out intent GET redirects to Threads login with the original intent preserved.
- [Meta share button reference](https://developers.facebook.com/docs/plugins/share-button/) was rate-limited in the web reader; the first-party `sharer.php` GET resolved to `facebook.com/share_channel/`. Actual authenticated chooser/composer completion is NOT VERIFIED.
- Instagram is an explicit copy/open workflow; no direct sharing API claim.

## Responsive and accessibility verification

Chromium145.0.7632.6 on Windows,375/390/1280px:26 candidate cases PASS plus2
baseline captures. Roles/API/clipboard/native Web Share are synthetic; provider
popups are intercepted. Tests verify canonical targets, social URL encoding,
copy success/failure/fallback, modal Tab/Shift+Tab, Escape, focus restoration,
reopening, public and cabinet entry points, UIv1, no horizontal overflow and no
page errors. The first browser run exposed desktop clipping; share-only placement
now measures the mounted content height, and maximum height respects remaining
viewport space. Initial Copy Link is visible; expanded guidance can scroll inside
the modal. Request/video/about overlay behavior is unchanged.

Screenshots: `share-375.png`, `share-390.png`, `share-1280.png` show initial UI;
`share-expanded-375.png` shows fallback guidance and Instagram copy success.
`before-1280.png` captures the previous custom UI. `before-375.png` captures the
profile after safely intercepting its native-share call, NOT the Windows native
sheet. Baseline instrumentation records one native call at375px and none in the
candidate; the test never opens a real OS share workflow.

Run from the frontend worktree using already installed Playwright:

```powershell
$env:PLAYWRIGHT_MODULE='<existing playwright-core directory>'
$env:SHARE_ORIGIN='http://127.0.0.1:5461'
$env:SHARE_BASELINE='http://127.0.0.1:5460'
$env:SHARE_EVIDENCE='<new evidence directory>'
node docs/ui-v2/evidence/public-profile-share/browser.cjs
```

The script rejects non-local origins and existing output directories. Full local
logs and initial failing diagnostics are preserved outside repositories under
`_preservation/public-profile-share-20261107`. No backend/staging/production,
account, booking, email, Jira or deployment operation occurred. Real authenticated
Telegram/Facebook/Threads/Instagram, Pixel, Safari/Firefox and screen-reader
acceptance remain manual gates. No provider publication was attempted.

Local validation: focused Vitest318 PASS; final full Vitest2350 PASS; production
build PASS; typecheck has9 pre-existing diagnostics and0 new (exit2);
`git diff --check` PASS. No separate lint script exists in package.json.
