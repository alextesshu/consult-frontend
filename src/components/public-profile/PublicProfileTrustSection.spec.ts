import { fireEvent, render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileTrustSection from './PublicProfileTrustSection.vue'

function buildProps(overrides: Record<string, unknown> = {}) {
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
    isImageDocument: (document: { file_url?: string | null }) =>
      String(document.file_url || '').endsWith('.jpg') || String(document.file_url || '').endsWith('.png'),
    isPdfDocument: (document: { file_url?: string | null }) => String(document.file_url || '').endsWith('.pdf'),
    documentKindLabel: () => 'Certificate',
    formatDate: () => '01.03.2026',
    ...overrides,
  }
}

describe('PublicProfileTrustSection', () => {
  it('renders dedicated competence content and keeps documents collapsed by default', () => {
    render(PublicProfileTrustSection, { props: buildProps() })

    expect(screen.getByRole('heading', { name: 'Моя професійна підготовка' })).toBeInTheDocument()
    expect(
      screen.getByText(/Цей розділ містить інформацію, яку спеціаліст вирішив опублікувати/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/не позначає їх як перевірені платформою/i)).toBeInTheDocument()
    expect(screen.getByText('Focused on evidence-based practice.')).toBeInTheDocument()
    expect(screen.getByText('Master in psychology')).toBeInTheDocument()
    expect(screen.getByText('Schema intensive')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Документи та сертифікати' })).toBeInTheDocument()
    expect(screen.getByText(/Документи додані спеціалістом/i)).toBeInTheDocument()
    expect(screen.getByText('1 документ')).toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: 'Показати документи, 1' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'public-profile-documents-grid')
    expect(screen.queryByText('CBT Certificate')).not.toBeInTheDocument()
    expect(screen.queryByText(/Матеріали, завантажені спеціалістом для ознайомлення/i)).not.toBeInTheDocument()
    expect(document.body.textContent || '').not.toContain('перевірено платформою')
  })

  it('does not render the documents subsection when no public documents exist', () => {
    render(PublicProfileTrustSection, {
      props: {
        ...buildProps(),
        publicDocuments: [],
      },
    })

    expect(screen.getByRole('heading', { name: 'Моя професійна підготовка' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Документи та сертифікати' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Показати документи/i })).not.toBeInTheDocument()
  })

  it('hides the entire trust section when competence and documents are empty', () => {
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

  it('shows multiple-document count while keeping the grid absent before expansion', () => {
    render(PublicProfileTrustSection, {
      props: {
        ...buildProps(),
        publicDocuments: [
          {
            id: 1,
            title: 'CBT Certificate',
            file_url: 'https://example.com/cbt.pdf',
            document_kind: 'CERTIFICATE',
          },
          {
            id: 2,
            title: 'Diploma',
            file_url: 'https://example.com/diploma.jpg',
            document_kind: 'DIPLOMA',
          },
          {
            id: 3,
            title: 'Professional License',
            file_url: 'https://example.com/license.pdf',
            document_kind: 'OTHER',
          },
        ],
      },
    })

    expect(screen.getByText('3 документи')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Показати документи, 3' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.queryByText('CBT Certificate')).not.toBeInTheDocument()
    expect(document.querySelector('#public-profile-documents-grid')).toBeNull()
  })

  it('expands and collapses the document grid with accessible state changes', async () => {
    render(PublicProfileTrustSection, { props: buildProps() })

    const toggle = screen.getByRole('button', { name: 'Показати документи, 1' })
    await fireEvent.click(toggle)

    expect(screen.getByRole('button', { name: 'Згорнути документи, 1' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByText('CBT Certificate')).toBeInTheDocument()
    expect(screen.getByText('Додано: 01.03.2026')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити документ' })).toHaveAttribute(
      'href',
      'https://example.com/cbt.pdf'
    )

    await fireEvent.click(screen.getByRole('button', { name: 'Згорнути документи, 1' }))

    expect(screen.getByRole('button', { name: 'Показати документи, 1' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.queryByText('CBT Certificate')).not.toBeInTheDocument()
  })

  it('preserves image card rendering after expansion', async () => {
    render(PublicProfileTrustSection, {
      props: {
        ...buildProps(),
        publicDocuments: [
          {
            id: 7,
            title: 'Diploma scan',
            file_url: 'https://example.com/diploma.png',
            document_kind: 'DIPLOMA',
          },
        ],
        documentKindLabel: () => 'Diploma',
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Показати документи, 1' }))

    expect(screen.getByAltText('Diploma scan')).toHaveAttribute('src', 'https://example.com/diploma.png')
    expect(screen.getByText('Diploma')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Відкрити' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    )
  })

  it('preserves PDF/open-file behavior and missing file fallback after expansion', async () => {
    render(PublicProfileTrustSection, {
      props: {
        ...buildProps(),
        publicDocuments: [
          {
            id: 8,
            title: 'PDF certificate',
            file_url: 'https://example.com/certificate.pdf',
            document_kind: 'CERTIFICATE',
          },
          {
            id: 9,
            title: 'Unavailable document',
            file_url: null,
            document_kind: 'OTHER',
          },
        ],
      },
    })

    await fireEvent.click(screen.getByRole('button', { name: 'Показати документи, 2' }))

    const grid = document.querySelector('#public-profile-documents-grid') as HTMLElement
    expect(grid).toBeTruthy()
    expect(within(grid).getByText('PDF certificate')).toBeInTheDocument()
    expect(within(grid).getByRole('link', { name: 'Відкрити документ' })).toHaveAttribute(
      'target',
      '_blank'
    )
    expect(within(grid).getByText('Unavailable document')).toBeInTheDocument()
    expect(within(grid).getByText('Перегляд файла тимчасово недоступний.')).toBeInTheDocument()
  })
})
