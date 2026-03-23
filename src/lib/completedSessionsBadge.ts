export function getCompletedSessionsBadge(count: number | null | undefined): string | null {
  if (!count || count < 50) return null
  if (count >= 1000) return '1000+'
  if (count >= 500) return '500+'
  if (count >= 100) return '100+'
  return '50+'
}
