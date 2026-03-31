import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SignupView from './SignupView.vue'
import { enableSpecialist } from '../lib/api'

const mockPush = vi.fn()
const mockSignup = vi.fn()
const mockLoadMe = vi.fn()
const loadingRef = ref(false)
const mockMe = ref<any>(null)
const mockUser = ref<any>(null)

vi.mock('pinia', () => ({
  storeToRefs: () => ({ loading: loadingRef }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({
    me: mockMe.value,
    user: mockUser.value,
    signup: mockSignup,
    loadMe: mockLoadMe,
  }),
}))

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    enableSpecialist: vi.fn(),
    getApiErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback),
  }
})

const mockedEnableSpecialist = vi.mocked(enableSpecialist)

function renderView() {
  return render(SignupView, {
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  })
}

describe('SignupView dual-role enable flow', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockSignup.mockReset()
    mockLoadMe.mockReset()
    mockedEnableSpecialist.mockReset()
    loadingRef.value = false
    mockMe.value = null
    mockUser.value = null
  })

  it('uses enable-specialist flow for authenticated client-only user', async () => {
    mockMe.value = {
      user: {
        id: 11,
        username: 'client1',
        email: 'client1@example.com',
        roles: ['CLIENT'],
      },
    }
    mockedEnableSpecialist.mockResolvedValue(undefined)
    mockLoadMe.mockResolvedValue(undefined)

    renderView()

    const enableButton = screen.getByRole('button', { name: 'Увімкнути кабінет спеціаліста' })
    await fireEvent.click(enableButton)

    await waitFor(() => {
      expect(mockedEnableSpecialist).toHaveBeenCalledTimes(1)
      expect(mockLoadMe).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/cabinet')
    })
  })
})
