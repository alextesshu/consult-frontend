import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileAboutSection from './PublicProfileAboutSection.vue'

const heading = '\u041e\u0441\u043d\u043e\u0432\u043d\u0456 \u0437\u0430\u043f\u0438\u0442\u0438'
const anxiety = '\u0422\u0440\u0438\u0432\u043e\u0433\u0430'
const stress = '\u0421\u0442\u0440\u0435\u0441'
const selfEsteem = '\u0421\u0430\u043c\u043e\u043e\u0446\u0456\u043d\u043a\u0430'
const goalSetting = '\u041f\u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430 \u0446\u0456\u043b\u0435\u0439'
const motivation = '\u041c\u043e\u0442\u0438\u0432\u0430\u0446\u0456\u044f'
const selfDiscipline = '\u0421\u0430\u043c\u043e\u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0430'
const firstParagraph = '\u041f\u0435\u0440\u0448\u0438\u0439 \u0430\u0431\u0437\u0430\u0446 \u0442\u0435\u043a\u0441\u0442\u0443.'
const secondParagraph = '\u0414\u0440\u0443\u0433\u0438\u0439 \u0430\u0431\u0437\u0430\u0446 \u0442\u0435\u043a\u0441\u0442\u0443.'
const paragraph =
  '\u042f \u043f\u0440\u0430\u0446\u044e\u044e \u0456\u0437 \u0437\u0430\u043f\u0438\u0442\u0430\u043c\u0438, ' +
  '\u043f\u043e\u0432\u02bc\u044f\u0437\u0430\u043d\u0438\u043c\u0438 \u0437 \u0442\u0440\u0438\u0432\u043e\u0433\u043e\u044e, ' +
  '\u0435\u043c\u043e\u0446\u0456\u0439\u043d\u0438\u043c \u0432\u0438\u0441\u043d\u0430\u0436\u0435\u043d\u043d\u044f\u043c, ' +
  '\u0441\u0430\u043c\u043e\u043e\u0446\u0456\u043d\u043a\u043e\u044e \u0442\u0430 ' +
  '\u0442\u0440\u0443\u0434\u043d\u043e\u0449\u0430\u043c\u0438 \u0443 \u0441\u0442\u043e\u0441\u0443\u043d\u043a\u0430\u0445.'
const secondLine =
  '\u0422\u0430\u043a\u043e\u0436 \u043c\u043e\u0436\u043d\u0430 \u0437\u0432\u0435\u0440\u0442\u0430\u0442\u0438\u0441\u044f, ' +
  '\u044f\u043a\u0449\u043e \u0441\u043a\u043b\u0430\u0434\u043d\u043e \u043f\u0440\u0438\u0439\u043c\u0430\u0442\u0438 ' +
  '\u0440\u0456\u0448\u0435\u043d\u043d\u044f.'

function renderSection(workWithText: string, workWithChips: string[] = []) {
  return render(PublicProfileAboutSection, {
    props: {
      aboutNarrativeText: '',
      workStyleText: '',
      workWithText,
      workWithChips,
      whoIsNotSuitableText: '',
    },
  })
}

function getMainRequestsSection() {
  const section = screen.getByRole('heading', { name: heading }).closest('section')
  expect(section).not.toBeNull()
  return section as HTMLElement
}

describe('PublicProfileAboutSection', () => {
  it('renders main request paragraph text without forcing a list', () => {
    const { container } = renderSection(paragraph)
    const section = getMainRequestsSection()

    expect(within(section).getByText(paragraph)).toHaveClass('scope-text')
    expect(section.querySelector('.scope-list')).toBeNull()
    expect(container).toHaveTextContent('\u042f \u043f\u0440\u0430\u0446\u044e\u044e \u0456\u0437 \u0437\u0430\u043f\u0438\u0442\u0430\u043c\u0438')
  })

  it('preserves multiline paragraph text without removing first letters', () => {
    const { container } = renderSection(`${paragraph}\n${secondLine}`)
    const section = getMainRequestsSection()

    expect(section.querySelector('.scope-list')).toBeNull()
    expect(container).toHaveTextContent(paragraph)
    expect(container).toHaveTextContent(secondLine)
  })

  it('renders hyphen bullet input as a clean list', () => {
    renderSection(`- ${anxiety}\n- ${stress}\n- ${selfEsteem}`)
    const items = within(getMainRequestsSection()).getAllByRole('listitem')

    expect(items.map((item) => item.textContent)).toEqual([anxiety, stress, selfEsteem])
  })

  it('renders bullet character input without duplicated bullets or cut letters', () => {
    renderSection(`\u2022 ${anxiety}\n\u2022 ${stress}\n\u2022 ${selfEsteem}`)
    const items = within(getMainRequestsSection()).getAllByRole('listitem')

    expect(items.map((item) => item.textContent)).toEqual([anxiety, stress, selfEsteem])
  })

  it('renders asterisk bullet input as a clean list', () => {
    renderSection(`* ${anxiety}\n* ${stress}`)
    const items = within(getMainRequestsSection()).getAllByRole('listitem')

    expect(items.map((item) => item.textContent)).toEqual([anxiety, stress])
  })

  it('preserves mixed paragraph and manual bullet blocks in order', () => {
    renderSection(
      `${firstParagraph}\n\n${secondParagraph}\n\n\u2022 ${goalSetting}\n\u2022 ${motivation}\n\u2022 ${selfDiscipline}`
    )
    const section = getMainRequestsSection()
    const paragraphs = Array.from(section.querySelectorAll('.scope-text')).map((item) => item.textContent)
    const items = within(section).getAllByRole('listitem')

    expect(paragraphs).toEqual([firstParagraph, secondParagraph])
    expect(items.map((item) => item.textContent)).toEqual([goalSetting, motivation, selfDiscipline])
    expect(paragraphs.join(' ')).not.toContain(goalSetting)
    expect(section.querySelectorAll('.scope-list')).toHaveLength(1)
  })

  it('renders concrete request chips separately before authored paragraph text', () => {
    renderSection(paragraph, [goalSetting, motivation, selfDiscipline])
    const section = getMainRequestsSection()
    const chipTexts = Array.from(section.querySelectorAll('.work-with__chip')).map((item) => item.textContent)

    expect(chipTexts).toEqual([goalSetting, motivation, selfDiscipline])
    expect(within(section).getByText(paragraph)).toHaveClass('scope-text')
    expect(section.querySelector('.work-with__chips')?.compareDocumentPosition(section.querySelector('.scope-text') as Node))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
