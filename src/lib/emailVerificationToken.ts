let pendingVerificationToken = ''

function verificationTokenFromHash(hash: string): string {
  const rawHash = String(hash || '').replace(/^#/, '')
  if (!rawHash) return ''
  try {
    return String(new URLSearchParams(rawHash).get('token') || '').trim()
  } catch {
    return ''
  }
}

/** Moves a verification token into memory before analytics can see the URL. */
export function captureEmailVerificationTokenFromLocation(): boolean {
  if (typeof window === 'undefined') return false
  if (window.location.pathname !== '/verify-email') return false

  const token = verificationTokenFromHash(window.location.hash)
  if (!token) return false

  pendingVerificationToken = token
  window.history.replaceState(window.history.state, document.title, '/verify-email')
  return true
}

export function takeEmailVerificationToken(): string {
  const token = pendingVerificationToken
  pendingVerificationToken = ''
  return token
}

export function resetEmailVerificationTokenForTests() {
  pendingVerificationToken = ''
}
