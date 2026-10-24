export type PublicMenuAudience = 'specialists' | 'clients'
export type PublicMenuLink = { label: string; to: string }

// Public-Mobile.dc.html P2. Items map only to routes and sections that exist today;
// the source "Блог" item has no public route and is intentionally absent.
export const PUBLIC_MENU_ITEMS: Record<PublicMenuAudience, PublicMenuLink[]> = {
  specialists: [
    { label: 'Як це працює', to: '/#how-it-works' },
    { label: 'Можливості', to: '/#features' },
    { label: 'Тарифи', to: '/#pricing' },
    { label: 'Часті питання', to: '/faq' },
  ],
  clients: [
    { label: 'Знайти спеціаліста', to: '/specialists' },
    { label: 'Як це працює', to: '/for-clients#clients-journey-title' },
    { label: 'Часті питання', to: '/for-clients#clients-faq-title' },
  ],
}

export const PUBLIC_MENU_PRIMARY: Record<PublicMenuAudience, PublicMenuLink> = {
  // Same destination as the hero "Створити простір безкоштовно" action.
  specialists: { label: 'Створити простір', to: '/signup' },
  clients: { label: 'Створити кабінет клієнта', to: '/signup-client' },
}
