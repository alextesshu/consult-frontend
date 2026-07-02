import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileTrustSection from './PublicProfileTrustSection.vue'

function buildProps() {
  return {
    educationSummary: 'Focused on evidence-based practice.',
    educationItems: ['Master in psychology', 'CBT training program'],
    professionalDevelopmentItems: ['Schema intensive', 'EMDR Level 1'],
    publicDocuments: [
      {
        id: 1,
        title: 'CBT Certificate',
        file_url: 'https://example.com/cbt.pdf',
        document_kind: 'CERTIFICATE',
        uploaded_at: '2026-03-01T10:00:00Z',
      },
    ],
    isImageDocument: () => false,
    isPdfDocument: () => true,
    documentKindLabel: () => 'Certificate',
    formatDate: () => '01.03.2026',
  }
}

describe('PublicProfileTrustSection', () => {
  it('renders dedicated competence content and supporting documents', () => {
    render(PublicProfileTrustSection, { props: buildProps() })

    expect(screen.getByRole('heading', { name: 'Професійний профіль' })).toBeInTheDocument()
    expect(
      screen.getByText(/Цей розділ містить інформацію, яку спеціаліст вирішив опублікувати/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/не позначає їх як перевірені платформою/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Focused on evidence-based practice.')).toBeInTheDocument()
    expect(screen.getByText('Master in psychology')).toBeInTheDocument()
    expect(screen.getByText('Schema intensive')).toBeInTheDocument()
    expect(screen.getByText('CBT Certificate')).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Коротко про професійну підготовку спеціаліста та матеріали, які він додав для ознайомлення.'
      )
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/матеріали, які він додав/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Матеріали, завантажені спеціалістом для ознайомлення/i)
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/Документи додані спеціалістом/i)
    ).toBeInTheDocument()
    const text = document.body.textContent || ''
    expect(text).not.toContain('перевірено платформою')
    expect(text).not.toContain('топ спеціалістів')
    expect(text).not.toContain('найкращі спеціалісти')
    expect(text).not.toContain('рекомендовано платформою')
  })

  it('hides section when competence and documents are empty', () => {
    const { container } = render(PublicProfileTrustSection, {
      props: {
        ...buildProps(),
        educationSummary: '',
        educationItems: [],
        professionalDevelopmentItems: [],
        publicDocuments: [],
      },
    })

    expect(container.querySelector('.panel--trust')).toBeNull()
  })
})
