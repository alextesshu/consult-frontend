export const EMAIL_VERIFICATION_REQUIRED_CODE = 'EMAIL_VERIFICATION_REQUIRED'
export const EMAIL_VERIFICATION_REQUIRED_MESSAGE = 'Спочатку підтвердьте email акаунта.'

export function isEmailVerificationRequiredError(error: unknown): boolean {
  const code = (error as { response?: { data?: { code?: unknown } } })?.response?.data?.code
  return code === EMAIL_VERIFICATION_REQUIRED_CODE
}

export function emailVerificationRequiredMessage(error: unknown, fallback: string): string {
  return isEmailVerificationRequiredError(error) ? EMAIL_VERIFICATION_REQUIRED_MESSAGE : fallback
}
