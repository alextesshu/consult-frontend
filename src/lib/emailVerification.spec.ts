import { describe, expect, it } from 'vitest'
import {
  EMAIL_VERIFICATION_REQUIRED_MESSAGE,
  emailVerificationRequiredMessage,
  isEmailVerificationRequiredError,
} from './emailVerification'

describe('email verification gate presentation', () => {
  it('recognizes only the canonical backend gate code', () => {
    const gateError = { response: { status: 403, data: { code: 'EMAIL_VERIFICATION_REQUIRED' } } }
    expect(isEmailVerificationRequiredError(gateError)).toBe(true)
    expect(emailVerificationRequiredMessage(gateError, 'fallback')).toBe(EMAIL_VERIFICATION_REQUIRED_MESSAGE)
    expect(emailVerificationRequiredMessage({ response: { data: { code: 'OTHER' } } }, 'fallback')).toBe('fallback')
  })
})
