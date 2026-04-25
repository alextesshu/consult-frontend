# PRO CONSULT — Manual Client Cards RFC

## 1. Status

Proposed.

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
* access workbook/materials
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

Add primary or secondary CTA:

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

## 8.2 Client detail page

For manually created clients, show:

* contact info
* internal note
* sessions
* notes history
* payment state if relevant
* action to create session
* action to invite to cabinet

Possible CTA:

```text
Запросити клієнта в кабінет
```

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

Likely affected areas:

* clients list
* client detail
* session creation flow
* session detail display
* tariff/access limit messages
* onboarding/readiness hints
* maybe dashboard/work queue

Do not implement frontend-only mock data.

Frontend must follow backend contract.

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

MVP should not include yet:

* automatic account creation
* automatic deduplication
* automatic guest conversion
* complex import
* bulk upload
* advanced consent flows
* full invitation system, unless backend structure is already simple enough

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
