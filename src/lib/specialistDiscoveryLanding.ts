import type { SpecialistDiscoveryDirection } from './api'

export const PSYCHOLOGICAL_SUPPORT_LANDING = {
  code: 'psychological_support',
  path: '/specialists/psychological-support',
  direction: 'psychological_support' as SpecialistDiscoveryDirection,
  heading: 'Психологічна допомога',
  title: 'Психологічна допомога — знайти спеціаліста | Pro Consult',
  description: 'Перегляньте спеціалістів Pro Consult, які працюють у напрямі психологічної допомоги. Відкрийте профіль, дізнайтеся про формат роботи та залиште запит або запишіться на сесію.',
  intro: 'Тут зібрані спеціалісти, які працюють у напрямі психологічної допомоги. Ви можете переглянути їхні професійні сторінки, теми роботи, формат і умови консультацій, а потім звернутися до обраного спеціаліста безпосередньо через Pro Consult.',
  broadDiscoveryLinkLabel: 'Переглянути всіх спеціалістів',
} as const
