import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from './http'
import { signupClient, signupSpecialist, registrationNameError, normalizeRegistrationName, RegistrationError } from './api'
import { professionalFocusValues } from '../constants/professionalFocus'
vi.mock('./http', () => ({ http: { post: vi.fn() } }))
const post = vi.mocked(http.post)
beforeEach(() => { post.mockReset(); post.mockResolvedValue({ data: { access: 'in-memory-test-token' } }) })
describe('registration contract transport', () => {
  it('keeps both legacy payloads and attribution exact', async () => {
    const acquisition = { utm_source: 'fixture', first_landing_path: '/' }
    await signupSpecialist('s@example.test', 'password123', 'password123', acquisition)
    expect(post).toHaveBeenLastCalledWith('/auth/signup/', { email: 's@example.test', password: 'password123', password_confirm: 'password123', acquisition })
    await signupClient('c@example.test', 'password123', 'password123')
    expect(post).toHaveBeenLastCalledWith('/auth/signup-client/', { email: 'c@example.test', password: 'password123', password_confirm: 'password123' })
  })
  it.each(professionalFocusValues)('sends v2 specialist focus %s without synthetic confirmation', async focus => {
    const contract = { registration_contract_version: 2 as const, first_name: 'Олена', professional_focus: focus }
    const acquisition = { utm_source: 'fixture', first_landing_path: '/' }
    await signupSpecialist('s@example.test', 'password123', undefined, acquisition, contract)
    expect(post).toHaveBeenCalledWith('/auth/signup/', { email: 's@example.test', password: 'password123', ...contract, acquisition })
    expect(post.mock.calls[0]![1]).not.toHaveProperty('password_confirm')
  })
  it('forwards an explicitly supplied v2 confirmation for server mismatch validation', async () => {
    await signupClient('c@example.test', 'password123', 'different', { registration_contract_version: 2, first_name: 'Олена' })
    expect(post).toHaveBeenCalledWith('/auth/signup-client/', { email: 'c@example.test', password: 'password123', password_confirm: 'different', registration_contract_version: 2, first_name: 'Олена' })
  })
  it('sends only client v2 fields', async () => {
    const contract = { registration_contract_version: 2 as const, first_name: 'مريم' }
    await signupClient('c@example.test', 'password123', undefined, contract)
    expect(post).toHaveBeenCalledWith('/auth/signup-client/', { email: 'c@example.test', password: 'password123', ...contract })
  })
  it.each([400, 429, 500])('retains field-specific server errors for status %s', async status => {
    post.mockRejectedValueOnce({ response: { status, data: { first_name: ['Invalid name'], professional_focus: ['Invalid focus'] } } })
    try { await signupSpecialist('s@example.test', 'password123', undefined, undefined, { registration_contract_version: 2, first_name: 'name', professional_focus: 'other' }); throw Error('Expected rejection') }
    catch (err) { expect(err).toBeInstanceOf(RegistrationError); expect((err as RegistrationError).fields).toEqual({ first_name: 'Invalid name', professional_focus: 'Invalid focus' }) }
  })
})
describe('v2 Unicode name validation', () => {
  const controls = [...'\u061c\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069']
  it.each(controls.flatMap(c => [c, 'Olena' + c]))('rejects bidi %j', value => expect(registrationNameError(value)).not.toBe(''))
  it.each(['', '  ', '\u200b', '\u200c\u200d', '\u0301', '\u034f', '\ufe0f', '\u115f', '\u1160', '\u3164', '\uffa0', ' \u200b \u0301 ', '\ud800', 'A\nB', 'A\x00', 'x'.repeat(151), null, 2, true, [], {}])('rejects invalid name %j', value => expect(registrationNameError(value)).not.toBe(''))
  it.each(['Олена', 'José', 'Jose\u0301', 'مريم', 'क्\u200dष', 'क्\u200cष', 'مریم\u200cرضا', 'Anne Marie', '李', 'x'.repeat(150)])('preserves meaningful Unicode %j', value => expect(registrationNameError(value)).toBe(''))
  it('normalizes NFC and Python whitespace before counting code points', () => {
    expect(normalizeRegistrationName('  Jose\u0301\u3000  Marie ')).toBe('José Marie')
    expect(registrationNameError('e\u0301'.repeat(150))).toBe('')
    expect(registrationNameError('𐐀'.repeat(150))).toBe('')
    expect(registrationNameError('𐐀'.repeat(151))).not.toBe('')
  })
})
