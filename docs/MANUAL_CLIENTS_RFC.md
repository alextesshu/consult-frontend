# PRO CONSULT — Manual Client Cards RFC

## 1. Status

Accepted direction. Frontend manual client records, manual session creation, and manual payment polish are active as of 2026-04-28.

This document defines the product concept and implementation direction for allowing specialists to create client cards manually, without requiring the client to register first.

---

## 2. Core Idea

A client in the specialist workspace should not always require a registered user account.

Main distinction:

```text
Client record in specialist practice
≠
Registered client user account
````

The specialist should be able to create and manage a client card manually.

The client cabinet should be an option, not a prerequisite.

---

## 3. Product Principle

```text
Кабінет клієнта має бути опцією, а не передумовою для роботи спеціаліста з клієнтом.
```

Specialists often already have clients from:

* Instagram
* Telegram
* referrals
* offline work
* previous practice
* personal contacts

Forcing those clients to register before the specialist can work with them creates unnecessary friction.

---

## 4. Tariff Principle

```text
У тарифах рахуються активні клієнтські картки спеціаліста, незалежно від того, чи має клієнт власний акаунт.
```

Active client limit should count:

* registered client relations
* manually created active client cards

Active client limit should not count:

* archived client cards
* guest/external session participants
* cancelled leads
* incomplete draft records, if they are not used as active clients

---

## 5. Client Types

## 5.1 Registered client

A client with a user account and client cabinet.

Can:

* book sessions
* view own sessions
* receive notifications
* access own sessions, reminders, payment/instructions, communication, and explicitly shared materials
* see payment/session information
* interact through the client-side workspace

## 5.2 Specialist-created client

A client card created by the specialist.

The client does not need an account yet.

Specialist can:

* add name
* add email/phone/telegram if available
* create sessions
* keep notes
* view session history
* mark payment state
* later invite the client to create a cabinet

## 5.3 Guest / external session participant

A guest participant for a guest/external session.

This should remain separate from the client base.

Guest sessions are session-scoped and should not automatically become client records.

## 5.4 Confidentiality rule for notes/workbook

Private session notes and workbook / `Робочий зошит` are specialist-only confidential documents.

Frontend copy must never imply that connecting a client cabinet gives the client access to specialist notes or workbook.

Canonical safe cabinet wording:

```text
Підключення кабінету дасть клієнту доступ до власних сесій, нагадувань, оплати та комунікації зі спеціалістом.
```

Safe workbook wording:

```text
Робочий зошит по клієнту
Внутрішній робочий зошит спеціаліста
Внутрішній розділ спеціаліста, не видимий клієнту.
```

Avoid:

```text
Робочий зошит клієнта
клієнту відкриється робочий зошит
доступ до робочого зошита
access workbook/materials
```

unless the text explicitly says it is specialist-only and not visible to the client.

---

## 6. Why This Improves the Product

This makes PRO CONSULT closer to the real workflow of private practice.

Specialist value improves because they can:

* start using the system immediately
* migrate existing clients into the product
* manage practice without waiting for client registration
* keep notes and session history from day one
* create sessions for existing clients
* later invite clients into the platform only when needed

This also improves onboarding:

```text
Заведіть першого клієнта → створіть сесію → додайте нотатку → побачте цінність системи
```

This is stronger than:

```text
Надішліть клієнту посилання і чекайте, поки він сам зареєструється
```

---

## 7. Main Product Requirements

## 7.1 Manual client creation

Specialist can create a client card manually.

Suggested fields for MVP:

* full name — required
* email — optional
* phone — optional
* telegram — optional
* short internal note — optional
* status: active / archived

Default status:

```text
active
```

If status is active, the card counts toward active client limit.

## 7.2 Active client counting

Active client count should include:

```text
registered active clients + manually created active client cards
```

This prevents tariff bypass and reflects actual product value.

## 7.3 Archive instead of delete-first logic

Specialist should be able to archive a manually created client.

Archived clients:

* remain in history
* do not count toward active client limit
* should not appear as active clients by default
* can be restored later if needed

## 7.4 Sessions for manual clients

Specialist should be able to create a session for a manually created client without requiring a client user account.

The session should belong to:

```text
specialist + client card
```

not necessarily:

```text
specialist + registered client user
```

## 7.5 Invite client to cabinet

Later, specialist can invite a manually created client to create a client account.

Flow:

```text
Specialist creates client card
→ specialist sends invite
→ client opens invite link
→ client registers/logs in
→ system links user account to existing client card
```

No automatic account should be created for the client.

## 7.6 Linking and deduplication

If a client registers later with the same email/phone, the system should not blindly merge records.

Better flow:

```text
Potential match found
→ specialist confirms linking
→ existing client card links to registered user account
```

Avoid automatic merging in MVP unless it is clearly safe.

---

## 8. UX Requirements

## 8.1 Clients page

Current frontend route:

```text
/cabinet/clients
```

Current primary/secondary CTA:

```text
Додати клієнта
```

Client list should distinguish, if needed:

* registered client
* client card without account
* archived client

Possible labels:

```text
З кабінетом
Без кабінету
Архівований
```

Current FE behavior:

* manual client records are displayed in `/cabinet/clients`
* FE separates ClientRecord source from account-linked state
* manual ClientRecord without linked account has badge `Без кабінету`
* manual ClientRecord with linked account has badge `З кабінетом`
* registered clients have badge `З кабінетом`
* manual ClientRecord without linked account shows specialist-side account invite controls:
  * create invite
  * copy invite link when available
  * regenerate invite
  * revoke invite
* manual clients can be created/edited/archived/restored
* manual clients are searchable/filterable
* manual client card shows:
  * custom/default session price
  * nearest session
  * payment status for nearest or last session
  * future sessions count
  * last session
  * short client description
* `Заплановано` was clarified to `Майбутніх сесій`
* canonical manual-client payment summary labels are `Оплата найближчої` and `Оплата останньої`
* canonical payment states are:
  * `Оплачено`
  * `Не оплачено`
  * `Очікує підтвердження оплати`
  * `Потребує рішення щодо оплати`
  * `Оплату повернено`
  * `Зараховано на майбутню сесію`
  * `Оплату залишено за домовленістю`
  * `Немає сесій`
  * `Немає даних про оплату`

## 8.2 Client detail page

For manually created clients, show:

* contact info
* internal note
* sessions
* notes history
* payment state if relevant
* action to create session
* action to invite to cabinet

Current manual session creation behavior:

* route: `/cabinet/clients`
* manual client card has CTA `Створити сесію`
* linked ClientRecord remains the canonical manual/client-record card
* session creation continues through `POST /cabinet/client-records/{record_id}/sessions/`; backend resolves `Session.client` when `ClientRecord.user` exists
* modal allows choosing an available slot and session format
* after creation, FE redirects to created session detail
* manual session detail displays client identity as `Без кабінету`
* registered-client-only actions stay hidden for manual clients where unsupported

Future cabinet invite CTA:
Implemented in `/cabinet/clients` for manual ClientRecord rows without linked account:

```text
Запросити клієнта в кабінет
```

Cabinet invite copy must not imply client access to specialist notes or workbook. Use:

```text
Підключення кабінету дасть клієнту доступ до власних сесій, нагадувань, оплати та комунікації зі спеціалістом.
```

Current frontend copy is limited to client access to their own sessions in the client cabinet.

Client-facing invite flow:

* public route: `/client/invite/:token`
* preview is available without authentication
* unauthenticated clients are sent to `/login?redirect=/client/invite/:token` or `/signup-client?redirect=/client/invite/:token`
* invite page copy uses account-first wording:
  * title: `Запрошення підключити акаунт клієнта`
  * CTAs: `Увійти у свій акаунт` / `Створити свій акаунт клієнта`
  * no technical “ми повернемо вас” phrasing; after auth user explicitly confirms connection on invite page
* client signup honors safe internal redirect paths and falls back to `/client` for unsafe redirects
* authenticated clients accept through `POST /api/client/client-record-account-invites/{token}/accept/`
* after accept, frontend refreshes `me` and redirects to `/client`
* privacy boundary: the invite page does not expose `SessionNote`, `ClientJournal`, workbook content, `ClientRecord.internal_note`, or practice-board items

## 8.2.1 Manual session detail/payment UI

Current behavior:

* manual session detail has `Оплата сесії`
* session price snapshot is shown
* specialist can edit per-session price
* price edit affects only this session, not client custom price
* specialist can manually mark session paid
* manual payment is specialist-side only

## 8.2.2 Cancelled paid payment resolution UI

In `/cabinet/sessions`:

* cancelled paid unresolved session shows settlement badge, not only `Оплачено`
* session cards prioritize settlement status over basic payment status

In `/cabinet/sessions/{id}` block:

```text
Оплата після скасування
```

Pending state:

```text
Сесію скасовано, але оплату було підтверджено. Оберіть, як обробити оплату.
```

Actions:

```text
Позначити як повернену
Зарахувати на майбутню сесію
Залишити за домовленістю
```

Resolved states:

```text
Оплату повернено
Зараховано на майбутню сесію
Оплату залишено за домовленістю
```

Resolved state UX:

* hides three action buttons by default
* shows `Змінити рішення`
* edit mode allows changing note/resolution
* successful update toast: `Рішення щодо оплати оновлено.`

## 8.2.3 Session card status hierarchy

Current `/cabinet/sessions` card hierarchy:

```text
1. lifecycle status
2. payment / settlement status
3. time urgency
4. source/identity
5. attention flags only if meaningful
```

Cleanup rules:

* `Нова заявка` was removed as duplicate noise
* `Потрібне підтвердження` remains the clear `SCHEDULED` attention label
* priority action label should use `Підтвердити сесію`, not ambiguous `Підтвердити`

## 8.3 Tariff/limit UX

If specialist reaches active client limit, manual client creation should be blocked or require upgrade.

Message should explain:

```text
Активні клієнти рахуються за кількістю клієнтських карток у вашій практиці.
```

## 8.4 Guest sessions distinction

Guest session participants should not automatically appear in client list.

If later needed, add explicit action:

```text
Створити клієнта з гостя
```

This should be a separate future task.

---

## 9. Backend Concept

This needs backend review before implementation.

Possible model concept:

```text
ClientRecord / ClientRelation
```

Fields may include:

* specialist
* user nullable
* full_name
* email
* phone
* telegram
* internal_note
* status active/archived
* source manual/registered/imported/guest_converted
* created_at
* updated_at

Important:

```text
user can be null
```

That is the key architectural change.

## 9.1 AI Contract Alignment

This feature must follow `backend/docs/AI_CONTRACT.md`.

Important architectural constraint:

```text
PRO CONSULT should evolve toward a single unified Specialist-Client lifecycle.
```

Manual client cards must not become a disconnected parallel client system.

Approved interpretation:

ClientRecord is introduced as the specialist-owned client identity layer.

It may exist before a registered User account exists, but it must be designed as part of the unified Specialist-Client lifecycle.

Phase 1 may keep existing ClientRelation unchanged for backward compatibility, but the long-term direction should be:

Specialist + ClientRecord = practice client identity
ClientRecord.user = optional registered client account
ClientRelation = compatibility / lifecycle bridge for currently registered clients, or gradually linked/migrated

Manual records must still use canonical entitlement and active-client limit logic.

Forbidden:

creating fake User accounts
merging manual clients into guest/external sessions
bypassing active-client limits
creating a disconnected manual-client system that cannot later integrate into the specialist-client lifecycle
duplicating access logic outside canonical entitlement services

Implementation must be additive-first and backward-compatible.

## 10. Frontend Concept

Affected areas:

* clients list
* client detail
* session creation flow
* session detail display
* tariff/access limit messages
* onboarding/readiness hints
* maybe dashboard/work queue

Do not implement frontend-only mock data.

Frontend must follow backend contract.

Any frontend copy/UI change in Vue files must include checking/updating related `*.spec.ts` files.

Especially for:

* text labels
* status badges
* buttons
* route/CTA behavior
* confidentiality wording
* payment state labels
* manual-client surfaces

Likely spec files:

```text
src/views/TherapistClientsView.spec.ts
src/views/TherapistSessionDetailView.spec.ts
src/views/TherapistSessionsView.spec.ts
```

Validation commands for related FE work:

```powershell
cd C:\Users\admin\dev\portfolio\consult\frontend

npm run test:run -- src/views/TherapistClientsView.spec.ts src/views/TherapistSessionDetailView.spec.ts src/views/TherapistSessionsView.spec.ts
npm run typecheck
npm run build
```

---

## 11. Risks

## 11.1 Duplicate clients

Manual card and registered account may represent the same person.

Mitigation:

* linking flow
* duplicate detection
* manual confirmation

## 11.2 Privacy and consent

Specialist may store personal data of clients.

Mitigation:

* clear product copy
* terms of use
* minimal MVP fields
* avoid sensitive fields by default
* never imply client access to specialist-only notes or workbook

## 11.3 Tariff bypass

If manual clients do not count toward active limit, specialists can bypass plan limits.

Mitigation:

* count all active client cards

## 11.4 Overcomplicated MVP

Full deduplication/invite/linking can become large.

Mitigation:

* implement in phases

---

## 12. Recommended Implementation Phases

## Phase 1 — Manual client card

Goal:

Specialist can manually create and archive client cards.

Scope:

* backend model/serializer/API
* clients list support
* active client count includes manual active clients
* basic frontend create form
* no client account required

## Phase 2 — Sessions for manual clients

Goal:

Specialist can create/manage sessions for manually created clients.

Scope:

* session creation supports client card without user
* session list/detail displays manual client correctly
* notes/payment/session history work

Frontend state:

* manual session creation from `/cabinet/clients` is active
* manual session detail and specialist-side payment controls are active
* registered-client-only actions stay hidden for manual clients where unsupported
* private notes and workbook remain specialist-only

## Phase 3 — Invite client to cabinet

Goal:

Specialist can invite manual client to register.

Scope:

* invite link
* registration/login flow
* link client user to existing client card

## Phase 4 — Deduplication/linking

Goal:

Prevent duplicate client records.

Scope:

* detect possible matches by email/phone
* suggest linking
* require confirmation

## Phase 5 — Guest-to-client conversion

Goal:

Allow specialist to convert guest session participant into a client card.

Scope:

* explicit action only
* no automatic conversion

---

## 13. Initial MVP Boundary

The first implementation should be limited.

MVP should include:

* create manual client
* list manual clients
* archive/restore manual client
* count active manual clients in tariff limit
* show whether client has cabinet or not
* create canonical sessions for manual clients from the client card
* show manual-client session/payment summary on the client card

MVP should not include yet:

* automatic account creation
* automatic deduplication
* automatic guest conversion
* complex import
* bulk upload
* advanced consent flows
* full invitation system, unless backend structure is already simple enough
* client access to specialist notes/workbook

---

## 14. Definition of Done for Phase 1

Phase 1 is done when:

* specialist can create a manual client card
* manual active clients appear in client list
* manual active clients count toward active client limit
* archived clients do not count toward active client limit
* specialist can archive and restore client cards
* registered clients continue to work as before
* guest session participants remain separate
* tests cover active client counting
* tests cover manual client creation
* frontend does not use mock data
* staging smoke check passes

---

## 15. Product Decision

Approved direction:

```text
Specialists should be able to create client cards manually.
```

Approved tariff logic:

```text
Active client limits count active client cards, not only registered user accounts.
```

Approved architecture principle:

```text
Client account linking is optional and can happen later.
```
