import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import DatePickerField from './DatePickerField.vue'

describe('DatePickerField', () => {
  it('renders a text input and no native date input', () => {
    const { container } = render(DatePickerField, {
      props: { modelValue: '26.06.2026', label: 'Дата' },
    })

    const input = screen.getByLabelText('Дата')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('placeholder', 'ДД.ММ.РРРР')
    expect(container.querySelector('input[type="date"]')).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(/06\/26\/2026/)
  })

  it('opens the calendar and emits display and ISO values when a day is selected', async () => {
    const { emitted } = render(DatePickerField, {
      props: { modelValue: '26.06.2026', label: 'Дата' },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Відкрити календар' }))

    expect(screen.getByText('Пн')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Попередній місяць' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Наступний місяць' })).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: '26.06.2026' }))

    expect(emitted('update:modelValue')?.at(-1)).toEqual(['26.06.2026'])
    expect(emitted('select-iso')?.at(-1)).toEqual(['2026-06-26'])
    expect(screen.queryByRole('button', { name: 'Попередній місяць' })).not.toBeInTheDocument()
  })

  it('normalizes typed display values on blur', async () => {
    const { emitted } = render(DatePickerField, {
      props: { modelValue: '5.6.2026', label: 'Дата' },
    })

    await fireEvent.blur(screen.getByLabelText('Дата'))
    expect(emitted('update:modelValue')?.at(-1)).toEqual(['05.06.2026'])
  })

  it('closes on outside click', async () => {
    render({
      components: { DatePickerField },
      template: '<div><DatePickerField model-value="26.06.2026" label="Дата" /><button>Outside</button></div>',
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Відкрити календар' }))
    expect(screen.getByRole('button', { name: 'Попередній місяць' })).toBeInTheDocument()

    await fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Попередній місяць' })).not.toBeInTheDocument()
    })
  })

  it('does not open when disabled', async () => {
    render(DatePickerField, {
      props: { modelValue: '26.06.2026', label: 'Дата', disabled: true },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Відкрити календар' }))
    expect(screen.queryByRole('button', { name: 'Попередній місяць' })).not.toBeInTheDocument()
  })
})
