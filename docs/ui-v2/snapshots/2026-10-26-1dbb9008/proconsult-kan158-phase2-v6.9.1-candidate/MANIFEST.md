# MANIFEST — KAN-158 Phase 2 · v6.9.1-candidate

**Статус:** KAN-158 Phase 2 — v6.9.1-candidate / PENDING REVIEW (не DESIGN READY, не APPROVED).
- Дата експорту: 2026-10-26
- Основа: v6.9-candidate (APPROVED WITH CHANGES) → правки review.
- Попередні версії збережено: handoff v6.8 (затверджений профіль 2.1 без змін), `proconsult-kan158-phase2-candidate` (v6.9), джерело v6.9 — `Specialist-Profile-Refine v6.9.dc.html`.

## Відкрити першими
1. `Specialist-Profile-Phase2-v6.9.1.html` — головний макет, офлайн. Секції: **D1** (1280), **T768/T820**, **M1** (375), **M2** (390, інтерактивний), **M3** (стани липкої панелі), **M4** (375, уся сторінка до футера), **T1** (часовий пояс).
   URL: `?mode=slots|empty|req`, `&offer=0|1|2` (без параметра — формат не вибрано), `&slot=16:00`.
2. `Profile-Edit-summary-limit-160.html` — поле «Коротко»: лічильник, maxlength 160.

## Скриншоти
| Файл | Стан |
|---|---|
| 01-desktop-1280-direct-slots-no-selection | Десктоп, формат не вибрано, «від 500 грн» |
| 02-desktop-1280-selected-2000-with-time | Вибрано «Парна» 2 000 грн + Чт 16:00 |
| 03a-desktop-1280-direct-no-slots | direct_booking без слотів |
| 03b-desktop-1280-request-only | request_only |
| 04-mobile-375-first-screen-min-price | 375, перший екран |
| 05-mobile-390-no-selection | 390, без вибору |
| 06-mobile-390-selected-2000-with-time | 390, 2 000 грн + час |
| 07-mobile-390-direct-no-slots | 390, без слотів |
| 08-mobile-390-request-only | 390, request_only |
| 09-mobile-sticky-bar-all-states | 6 станів липкої панелі |
| 10-mobile-375-full-page-footer | Уся сторінка: липка панель не перекриває останні секції й футер |
| 11/12-tablet-768/820-direct-slots | Планшет |
| 13-tablet-768-request-only | Планшет, request_only |
| 14-timezone-label | Мітка поясу |

Блок зовнішніх контактів — 01–03b, 10.
