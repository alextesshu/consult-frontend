# Specialist Public Profile URLs Contract

Last updated: 2026-04-12  
Status: canonical short URL phase closed

## Canonical Route Policy

- Canonical public specialist route is `/s/:slug`.
- Legacy public routes are compatibility-only fallback and must not be used as primary URL generation.

## Primary API Sources

- Primary public fetch: `GET /api/s/{slug}/`.
- Cabinet profile read/update: `GET/PATCH /api/cabinet/profile/`.
- Cabinet profile fields used by frontend:
  - `slug`
  - `public_profile_path`
  - `public_profile_url`

## Share UX Policy

- Cabinet share/open/copy actions must use:
  - `public_profile_url` (preferred absolute URL), or
  - `public_profile_path` (fallback path).
- Default share UX must not depend on legacy route templates or historical token semantics.

## Slug Semantics

- `specialist_slug` means canonical slug.
- `specialist_slug` is not a legacy public token.
- `specialist_slug` is not a UUID-like technical identifier.

## Slug Update Semantics

- Slug updates are performed via `PATCH /api/cabinet/profile/`.
- Frontend UI must map backend slug validation codes:
  - `SLUG_INVALID`
  - `SLUG_RESERVED`
  - `SLUG_TAKEN`

## Follow-Up Contract Notes

- Slug generation is transliteration-aware.
- Fallback slug cleanup (for values such as `specialist`, `specialist-2`) applies only when `public_profile_enabled=false`.
- Already public fallback URLs are not auto-rewritten.

## Regression Checklist

- [ ] Cabinet profile shows canonical public URL.
- [ ] Cabinet copy/open actions use canonical URL from `public_profile_url` or `public_profile_path`.
- [ ] Public profile opens correctly by canonical route `/s/{slug}`.
- [ ] Slug change via cabinet profile works for valid values.
- [ ] `SLUG_INVALID`, `SLUG_RESERVED`, and `SLUG_TAKEN` are mapped correctly in UI.
- [ ] Legacy compatibility routes continue to work.
