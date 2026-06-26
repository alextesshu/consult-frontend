import { fireEvent, render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import TimeSelectField from './TimeSelectField.vue'

describe('TimeSelectField', () => {
  it('renders a 24-hour select and no native time input', () => {
    const { container } = render(TimeSelectField, {
      props: { modelValue: '09:00', label: 'Час початку' },
    })

    const select = screen.getByLabelText('Час початку')
    expect(select.tagName).toBe('SELECT')
    expect(container.querySelector('input[type="time"]')).not.toBeInTheDocument()
    expect(within(select as HTMLElement).getByRole('option', { name: '09:10' })).toBeInTheDocument()
    expect(within(select as HTMLElement).queryByRole('option', { name: '09:25' })).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\b(?:AM|PM)\b/)
  })

  it('emits update:modelValue on change', async () => {
    const { emitted } = render(TimeSelectField, {
      props: { modelValue: '09:00', label: 'Час початку' },
    })

    await fireEvent.update(screen.getByLabelText('Час початку'), '09:10')
    expect(emitted('update:modelValue')?.at(-1)).toEqual(['09:10'])
  })

  it('supports disabled state', () => {
    render(TimeSelectField, {
      props: { modelValue: '09:00', label: 'Час початку', disabled: true },
    })

    expect(screen.getByLabelText('Час початку')).toBeDisabled()
  })
})
