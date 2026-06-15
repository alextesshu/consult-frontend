import { render, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import PublicProfileAboutSection from './PublicProfileAboutSection.vue'

const workStyleHeading = '\u0424\u043e\u0440\u043c\u0430\u0442 \u0440\u043e\u0431\u043e\u0442\u0438'
const heading = '\u041e\u0441\u043d\u043e\u0432\u043d\u0456 \u0437\u0430\u043f\u0438\u0442\u0438'
const boundariesHeading =
  '\u0417 \u0447\u0438\u043c \u044f \u043d\u0435 \u043f\u0440\u0430\u0446\u044e\u044e'
const boundariesHelperText =
  '\u0422\u0443\u0442 \u0441\u043f\u0435\u0446\u0456\u0430\u043b\u0456\u0441\u0442 \u043f\u043e\u044f\u0441\u043d\u044e\u0454, \u0443 \u044f\u043a\u0438\u0445 \u0432\u0438\u043f\u0430\u0434\u043a\u0430\u0445 \u043a\u0440\u0430\u0449\u0435 \u0437\u0432\u0435\u0440\u043d\u0443\u0442\u0438\u0441\u044f \u0434\u043e \u0456\u043d\u0448\u043e\u0433\u043e \u0444\u0430\u0445\u0456\u0432\u0446\u044f \u0430\u0431\u043e \u043e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043c\u0435\u0434\u0438\u0447\u043d\u0443 \u0434\u043e\u043f\u043e\u043c\u043e\u0433\u0443.'
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
const aboutParagraphs = [
  '\u042f \u043f\u0441\u0438\u0445\u043e\u043b\u043e\u0433 \u0442\u0430 \u0433\u0435\u0448\u0442\u0430\u043b\u044c\u0442-\u0442\u0435\u0440\u0430\u043f\u0435\u0432\u0442.',
  '\u0414\u043e \u043c\u0435\u043d\u0435 \u0447\u0430\u0441\u0442\u043e \u0437\u0432\u0435\u0440\u0442\u0430\u044e\u0442\u044c\u0441\u044f \u0437 \u0442\u0435\u043c\u0430\u043c\u0438 \u0442\u0440\u0438\u0432\u043e\u0433\u0438.',
  '\u042f \u043d\u0435 \u0434\u0430\u044e \u0443\u043d\u0456\u0432\u0435\u0440\u0441\u0430\u043b\u044c\u043d\u0438\u0445 \u043f\u043e\u0440\u0430\u0434.',
]

function renderSection(workWithText: string, workWithChips: string[] = []) {
  return render(PublicProfileAboutSection, {
    props: {
      workStyleText: '',
      workWithText,
      workWithChips,
      whoIsNotSuitableText: '',
    },
  })
}

function renderBoundariesSection(whoIsNotSuitableText: string) {
  return render(PublicProfileAboutSection, {
    props: {
      workStyleText: '',
      workWithText: '',
      workWithChips: [],
      whoIsNotSuitableText,
    },
  })
}

function renderWorkStyleSection(workStyleText: string) {
  return render(PublicProfileAboutSection, {
    props: {
      workStyleText,
      workWithText: '',
      workWithChips: [],
      whoIsNotSuitableText: '',
    },
  })
}

function getWorkStyleSection() {
  const section = screen.getByRole('heading', { name: workStyleHeading }).closest('section')
  expect(section).not.toBeNull()
  return section as HTMLElement
}

function getMainRequestsSection() {
  const section = screen.getByRole('heading', { name: heading }).closest('section')
  expect(section).not.toBeNull()
  return section as HTMLElement
}

function getBoundariesSection() {
  const section = screen.getByRole('heading', { name: boundariesHeading }).closest('section')
  expect(section).not.toBeNull()
  return section as HTMLElement
}

describe('PublicProfileAboutSection', () => {
  it('renders work style blank lines as separate paragraphs', () => {
    renderWorkStyleSection(`${firstParagraph}\n\n${secondParagraph}`)
    const section = getWorkStyleSection()
    const paragraphs = Array.from(section.querySelectorAll('.scope-text')).map((item) => item.textContent)

    expect(paragraphs).toEqual([firstParagraph, secondParagraph])
  })

  it('preserves single line breaks inside work style paragraph text', () => {
    renderWorkStyleSection(`${paragraph}\n${secondLine}`)
    const section = getWorkStyleSection()
    const workStyleParagraph = section.querySelector('.scope-text')

    expect(workStyleParagraph).not.toBeNull()
    expect(workStyleParagraph?.textContent).toBe(`${paragraph}\n${secondLine}`)
  })

  it('renders authored work boundaries as separate paragraphs without forcing a list', () => {
    renderBoundariesSection(aboutParagraphs.join('\n\n'))
    const section = getBoundariesSection()
    const paragraphs = Array.from(section.querySelectorAll('.scope-text')).map((item) => item.textContent)

    expect(paragraphs).toEqual(aboutParagraphs)
    expect(section.querySelector('.scope-list')).toBeNull()
    expect(section).toHaveTextContent(aboutParagraphs[0]!)
    expect(screen.queryByText(boundariesHelperText)).not.toBeInTheDocument()
  })

  it('renders explicit work boundary bullets as a vertical list', () => {
    renderBoundariesSection(`\u2022 ${anxiety}\n- ${stress}\n* ${selfEsteem}`)
    const section = getBoundariesSection()

    expect(within(section).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      anxiety,
      stress,
      selfEsteem,
    ])
    expect(section.querySelector('.scope-text')).toBeNull()
  })

  it('hides work boundaries when there is no authored content', () => {
    renderBoundariesSection('')

    expect(screen.queryByRole('heading', { name: boundariesHeading })).not.toBeInTheDocument()
    expect(screen.queryByText(boundariesHelperText)).not.toBeInTheDocument()
  })

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
    const mainRequestParagraph = section.querySelector('.scope-text')

    expect(section.querySelector('.scope-list')).toBeNull()
    expect(mainRequestParagraph?.textContent).toBe(`${paragraph}\n${secondLine}`)
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
