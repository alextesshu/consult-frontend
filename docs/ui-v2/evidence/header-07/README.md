# Approved Header 07 implementation

Base: `633ad808fd271015eb3655ce81832243350b7324`. Header only; footer branding is
an independent PR. UI v1 remains the default and admin chrome is unchanged.

## Approved source

The supplied file is named `Модернізація дизайну сайту ProConsult.zip` in
`Desktop/Consult/Claude Design/20261107`, although the task calls it `(2).zip`.
Its SHA-256 is `a21ce5959cef28374ce5a5b89cb48df01e1d3b372e760ebf6fdd36fe96150511`.
It contains the DESIGN READY [primary specification](HEADER_07_SPEC.md) and
`handoff/mockups/Header-Concepts.dc.html`, section 07. No alternatives, 07b,
prototype scripts or installation instructions were implemented. Existing
snapshots and SNAPSHOT_CURRENT.json remain unchanged.

`header07-fennec.svg` is byte-identical to the supplied official
`handoff/mockups/public/brand/fennec.svg`. Geometry, color, negative space and
metadata are unchanged. [Provenance](provenance.json) records its hash and the
self-hosted Google Fonts Manrope 800 asset/license. Manrope is used only by the
wordmark; UI text remains Onest. No new runtime font-CDN request is introduced.

## Behavior

- Cream desktop bar 76px; mobile bar 60px followed by a 34px mint slogan strip.
  The semantic mobile header contains both and is therefore 94px total. Sticky
  profile/cabinet offsets account for that complete height.
- Desktop/mobile mark32/30, Manrope800 wordmark18/16, letter spacing .02em,
  gaps11/9. Desktop slogan is visible at1440 for every supported role and at1280
  for guests; hidden at1280 for signed-in specialists/clients.
- Four real segmented links for guest/specialist; three for client. Route-aware
  active state, existing routes and auth/store/controllers are retained.
- Per product-owner clarification, specialists retain a separate visible desktop
  **Public Profile** button to `/public`, plus its existing mobile-menu entry.
- Account chip opens the existing account disclosure. Cabinet, Public Profile,
  chat, settings, notifications and logout remain reachable. Unread counts and
  initials come from the existing authenticated stores, never fixture constants.
- Specialist-owned public pages omit catalog/product/signup promotion. Minimal
  shells, client cabinet content and Calendar 3a business logic are unchanged.
- Mobile guest menu retains its existing full-screen focus/Escape/scroll lock.
  Account disclosure focuses its first action and returns focus on Escape.

## Responsive/accessibility decisions

The source has no768px tablet frame. The existing compact-navigation boundary
is retained at <=1100px; tablets keep the76px bar. Below768px the60+34 mobile
composition applies. Mobile action hit areas are44px rather than the source's
40px painted action, satisfying its explicit >=44px target requirement.
The approved orange unread badge uses navy digits for readable contrast;
the HTML exploration used white digits. Fill,18px size and2px cream border are
preserved. The primary specification does not prescribe the digit color.

## Executed validation

- Focused App/menu Vitest:123 PASS. Full Vitest:2318 PASS.
- Production build PASS. TypeScript reports the same9 baseline diagnostics as
  unmodified dev, zero new. `git diff --check` PASS.
- Chromium145.0.7632.6, Windows, synthetic intercepted APIs:120 geometry/route
  cases across375/390/768/1280/1440, guest/specialist/client, v1/v2, Home,
  For Clients, specialist-owned profile and cabinet/login transitions. No
  horizontal overflow or unexpected page errors in the route checks.
- Final account/menu/chat/notification/focus/logout check:10/10 role/viewport
  cases. Logout is intercepted and its asynchronous navigation is awaited.
- UI v1 header/footer comparisons:23/30 initially exact PNG matches. The7
  nonidentical captures (7 header pixels /207 footer pixels) were independently
  recaptured alongside two baseline controls:8/8 relevant header/footer pairs
  matched exactly, with stable baseline controls. No reproducible v1 visual
  regression. Initial captures and failures are retained outside tracked code.
- Browser checks found an inherited cabinet selector hiding the new account
  disclosure. A Header07-only display rule fixes it; final interaction checks
  pass. Initial failures are preserved rather than reported as successful runs.

Full logs, diagnostic scripts, baseline/control captures and geometry records:
`_preservation/header07-implementation-20261106T230315Z` outside the repositories.
`acceptance.json` records the evidence interpretation. Representative screenshots
are supplied here; fixtures are synthetic and are not authenticated backend proof.

Real signed-in staging specialist/client acceptance, notification behavior with
actual data, Pixel/mobile and Firefox/Safari/screen-reader acceptance remain
pending after a separately approved staging release. No deployment, real login,
booking, email, feature-flag activation or backend mutation was performed.
