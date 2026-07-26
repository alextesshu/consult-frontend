import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import ProfileVisibilityControl from './ProfileVisibilityControl.vue'

function renderControl(initialValue = true, hasValue = true) {
  return render(
    defineComponent({
      components: { ProfileVisibilityControl },
      setup() {
        return { value: ref(initialValue) }
      },
      template: `
        <ProfileVisibilityControl
          v-model="value"
          control-id="test-field"
          field-label="Тестове поле"
          :has-value="${hasValue}"
          hidden-warning="Поле заповнене, але не показується клієнтам."
        />
      `,
    })
  )
}

describe('ProfileVisibilityControl', () => {
  it('communicates the selected state with text and aria-pressed', async () => {
    renderControl(true)

    const showButton = screen.getByRole('button', { name: /Показувати клієнтам/ })
    const hideButton = screen.getByRole('button', { name: /Не показувати/ })
    expect(showButton).toHaveAttribute('aria-pressed', 'true')
    expect(hideButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Показується на публічній сторінці')).toBeInTheDocument()

    await fireEvent.click(hideButton)

    expect(showButton).toHaveAttribute('aria-pressed', 'false')
    expect(hideButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Приховано від клієнтів')).not.toBeInTheDocument()
    expect(screen.getByText('Поле заповнене, але не показується клієнтам.')).toBeInTheDocument()
  })

  it('supports keyboard activation and omits warnings for an empty field', async () => {
    renderControl(false, false)

    const showButton = screen.getByRole('button', { name: /Показувати клієнтам/ })
    await fireEvent.keyDown(showButton, { key: 'Enter' })

    expect(showButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('Поле заповнене, але не показується клієнтам.')).not.toBeInTheDocument()
  })

  it('renders an explanatory unavailable state without active controls', () => {
    render(ProfileVisibilityControl, {
      props: {
        modelValue: false,
        controlId: 'video',
        fieldLabel: 'Відеовізитка',
        available: false,
        unavailableText: 'Спочатку додайте відеовізитку.',
      },
    })

    expect(screen.getByText('Спочатку додайте відеовізитку.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Показувати клієнтам/ })).not.toBeInTheDocument()
  })

  it('hides the buttons and shows unavailable copy for an empty field', () => {
    render(ProfileVisibilityControl, {
      props: {
        modelValue: false,
        controlId: 'messenger',
        fieldLabel: 'Messenger / Signal',
        hasValue: false,
        available: false,
        unavailableText: 'Спочатку заповніть Messenger / Signal, щоб налаштувати його видимість.',
      },
    })

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(
      screen.getByText('Спочатку заповніть Messenger / Signal, щоб налаштувати його видимість.')
    ).toBeInTheDocument()
  })
})
