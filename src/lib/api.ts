import { http } from './http'

type TokenResponse = {
  access: string
  refresh: string
}

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<TokenResponse> {
  const isEmail = identifier.includes('@')
  const payload = isEmail
    ? { email: identifier, password }
    : { username: identifier, password }

  try {
    const resp = await http.post<TokenResponse>('/auth/token/', payload)
    return resp.data
  } catch (err: any) {
    const message = err?.response?.data?.detail || 'Login failed'
    throw new Error(message)
  }
}

export async function fetchMe(accessToken: string) {
  const resp = await http.get('/me/', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return resp.data
}

export async function refreshToken(refresh: string): Promise<TokenResponse> {
  const resp = await http.post<TokenResponse>('/auth/token/refresh/', { refresh })
  return resp.data
}
