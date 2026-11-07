# Header07 account-menu overflow regression

Base: `f6a1ec21f81cd4260861bd5f3d76aa2d1b936a77`.
Approved source remains Header Concept07 from the 2026-11-07 supplied ZIP,
SHA-256 `a21ce5959cef28374ce5a5b89cb48df01e1d3b372e760ebf6fdd36fe96150511`.
Official SVG, Manrope800, slogan, source snapshots and header geometry are unchanged.

## Root cause

`App.vue` declares the legacy `.mobile-menu` hidden by default and gives it
absolute positioning, a bounded width and item styling only inside the <=640px
media query. Header07 enables that same disclosure at all widths but previously
set only `display:block`, colors and offsets. On public routes at wider widths,
the panel therefore remained `position:static`, entered the header flex row,
and rendered account links inline. The duplicated-looking navigation was the
opened disclosure participating in normal layout, rather than an auth or font bug.
The previous geometry checks measured the closed header; account interaction
checks asserted visibility/focus without remeasuring document width while open.
That gap allowed the open-disclosure regression to pass the earlier smoke.

Synthetic Chromium reproduction on Home, specialist, account menu open:

| viewport | before document scrollWidth |
| --- | --- |
| 375 | 375 |
| 768 | 1215 |
| 1024 | 1215 |
| 1280 | 1777 |
| 1440 | 1995 |
| 1920 | 2235 |

At1280 client Home also reached1396px. Profile disclosure was likewise static,
even where the remaining whitespace prevented document overflow.

## Minimal fix

Only Header07 CSS changes at runtime: anchor the actions container, make the
existing disclosure absolute/grid at every width, bound it to280px/viewport,
and give each existing action its own44px row. No functionality is removed.
No global overflow hiding, new breakpoint/activation flag, API/auth/router,
Calendar logic, UIv1, font or SVG changes.

## Validation and reproduction

- Focused App/menu Vitest:136 PASS. Full Vitest:2331 PASS.
- Production build and diff check PASS. Typecheck:9 existing diagnostics,0 new
  (command remains nonzero, exit2).
- Chromium145.0.7632.6 matrix:168/168 PASS; final375/390 mobile follow-up
  after mint-strip clearance adjustment:48/48 PASS. Open/closed document
  scrollWidth equals viewport at all required widths.
- `browser.cjs` runs real DOM assertions at375/390/768/1024/1280/1440/1920,
  guest/specialist/client, UIv1/v2, Home/For Clients/profile/Calendar route.
  Guest/client protected Calendar URLs may redirect; actual routes are recorded.
- Menus must float within the viewport and preserve header/main horizontal
  geometry. Checks include intended visible controls, Public Profile access,
  Enter/Space/Escape/Tab/Shift+Tab, notification focus return and mobile guest menu.
- Authenticated roles and all API data are synthetic. Non-GET requests are
  fulfilled/blocked locally. This is not authenticated staging or real-device proof.

From the frontend worktree in PowerShell, with an existing local preview:

```powershell
$env:HEADER_ORIGIN='http://127.0.0.1:5453'
$env:HEADER_EVIDENCE='<new absolute evidence directory>'
$env:PLAYWRIGHT_MODULE='<existing playwright-core installation>'
node docs/ui-v2/evidence/header-07-overflow/browser.cjs
```

The script refuses non-local origins and existing output directories. Full local
logs and initial failed harness runs are retained outside the repository at
`_preservation/header07-overflow-20261107T002906Z`. The initial shared-Vite-cache
504 run was not layout evidence. An initial matrix used the wrong Calendar
selector and compared viewport Y after native focus scrolling; corrected checks
use the actual `.pc2-cal` root and stable horizontal geometry, without masking
layout overflow. Original failures/captures remain preserved.

Real authenticated localhost/staging and Firefox/Safari/Pixel visual acceptance
remain manual gates. No backend, staging, production or Jira operations.
