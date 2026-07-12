# Specialist Public Profile URLs Contract

Last updated: 2026-07-12
Status:
- Canonical short URL contract: production
- KAN-29 visibility model: production deployed, production smoke passed,
  manual production verification passed, Done

## Canonical Route Policy

- Canonical public specialist route is `/s/:slug`.
- Legacy public routes are compatibility-only fallback and must not be used as primary URL generation.
- An unpublished profile is not available through the canonical public route.
- There is no private preview mode for `/s/:slug`.

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
- Public open/copy actions are based on the persisted live publication state,
  not unsaved local toggle state.

## Visibility State Policy

`public_profile_enabled` and `is_search_visible` are separate controls.

| Saved state | Meaning |
| :-- | :-- |
| `public_profile_enabled=false`, `is_search_visible=false` | Profile is unpublished, `/s/:slug` is unavailable, and the specialist is absent from discovery/search. |
| `public_profile_enabled=true`, `is_search_visible=false` | Profile is published by direct link only and absent from discovery/search. |
| `public_profile_enabled=true`, `is_search_visible=true` | Profile is published by direct link and visible in opt-in discovery/search. |
| `public_profile_enabled=false`, `is_search_visible=true` | Invalid persisted state; backend normalizes/prevents it. |

Rules:
- Search visibility does not publish a profile.
- Unpublishing disables search visibility.
- Discovery/search listing requires both flags to be true.
- Local pending publish/unpublish states are not live until the general profile
  save succeeds.
- If a saved profile is still live while local unpublish is pending, public
  copy/open actions may remain available until save.

## Publication Readiness

Hard publication requirements are:
1. public display name;
2. about/description;
3. topics/requests;
4. work format;
5. first-contact/client-entry path;
6. base price decision.

Profile photo is recommended but not required for publication/search.

Frontend readiness and visibility copy should reflect the six hard
requirements. Do not describe photo as a blocking publication requirement.

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
- [ ] Unpublished profile does not open through `/s/{slug}`.
- [ ] Slug change via cabinet profile works for valid values.
- [ ] `SLUG_INVALID`, `SLUG_RESERVED`, and `SLUG_TAKEN` are mapped correctly in UI.
- [ ] Search visibility cannot be enabled while publication is off.
- [ ] Published-by-direct-link state does not appear in discovery/search.
- [ ] Published-plus-search state appears in discovery/search.
- [ ] Pending local publish/unpublish copy does not claim unsaved changes are live.
- [ ] Legacy compatibility routes continue to work.
