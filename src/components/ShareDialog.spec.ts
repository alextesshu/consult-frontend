import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ShareDialog from './ShareDialog.vue'

const canonicalUrl = 'https://proconsult.space/s/canonical-specialist/journal/article-slug'
const articleTitle = 'Як підготуватися до першої консультації'

function setClipboard(writeText?: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  })
}

function setExecCommand(implementation: () => boolean) {
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value: vi.fn(implementation),
  })
}

function renderDialog() {
  return render(ShareDialog, {
    props: {
      open: true,
      canonicalUrl,
      title: articleTitle,
      heading: 'Поділитися дописом',
      copyLabel: 'Скопіювати посилання',
    },
  })
}

describe('ShareDialog', () => {
  beforeEach(() => {
    setClipboard(vi.fn().mockResolvedValue(undefined))
    setExecCommand(() => true)
    vi.spyOn(window, 'open').mockReturnValue({ opener: window } as unknown as Window)
  })

  it('has an accessible name, focuses copy first, closes from its button and supports Escape', async () => {
    const result = renderDialog()

    expect(await screen.findByRole('dialog', { name: 'Поділитися дописом' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Скопіювати посилання' })).toHaveFocus()

    await fireEvent.click(screen.getByRole('button', { name: 'Закрити' }))
    expect(result.emitted('close')).toHaveLength(1)

    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(result.emitted('close')).toHaveLength(2)
  })

  it('traps forward and reverse tab navigation inside the dialog', async () => {
    renderDialog()
    const dialog = await screen.findByRole('dialog')
    const close = screen.getByRole('button', { name: 'Закрити' })
    const threads = screen.getByRole('button', { name: 'Threads' })

    threads.focus()
    await fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(close).toHaveFocus()

    close.focus()
    await fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(threads).toHaveFocus()
  })

  it('copies the canonical URL with Clipboard API and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    renderDialog()

    await fireEvent.click(await screen.findByRole('button', { name: 'Скопіювати посилання' }))

    expect(writeText).toHaveBeenCalledWith(canonicalUrl)
    const feedback = await screen.findByText('Посилання скопійовано')
    expect(feedback.closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('emits only approved semantic destinations for profile sharing actions', async () => {
    const result = renderDialog()
    await fireEvent.click(await screen.findByRole('button', { name: 'Скопіювати посилання' }))
    await fireEvent.click(screen.getByRole('link', { name: 'Telegram' }))
    await fireEvent.click(screen.getByRole('link', { name: 'Facebook' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Threads' }))

    expect(result.emitted('shared')).toEqual([
      ['copy_link'],
      ['telegram'],
      ['facebook'],
      ['threads'],
    ])
  })

  it('uses execCommand when Clipboard API is unavailable and always removes its textarea', async () => {
    setClipboard()
    const execCommand = vi.fn(() => true)
    setExecCommand(execCommand)
    renderDialog()

    await fireEvent.click(await screen.findByRole('button', { name: 'Скопіювати посилання' }))

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea[data-article-share-fallback]')).toBeNull()
    expect(screen.getByText('Посилання скопійовано')).toBeInTheDocument()
  })

  it('cleans up fallback state and shows a Ukrainian message when copying fails', async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error('Permission denied')))
    setExecCommand(() => false)
    renderDialog()

    await fireEvent.click(await screen.findByRole('button', { name: 'Скопіювати посилання' }))

    expect(document.querySelector('textarea[data-article-share-fallback]')).toBeNull()
    expect(
      await screen.findByText('Не вдалося скопіювати посилання. Спробуйте ще раз.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Permission denied/)).not.toBeInTheDocument()
  })

  it('builds correctly encoded Telegram and Facebook targets', async () => {
    renderDialog()
    await screen.findByRole('dialog')

    expect(screen.getByRole('link', { name: 'Telegram' })).toHaveAttribute(
      'href',
      `https://t.me/share/url?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(articleTitle)}`
    )
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute(
      'href',
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`
    )
  })

  it('prepares Threads text first and opens Threads only from the explicit follow-up action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard(writeText)
    renderDialog()

    await fireEvent.click(await screen.findByRole('button', { name: 'Threads' }))

    expect(window.open).not.toHaveBeenCalled()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(`${articleTitle}\n${canonicalUrl}`)
    expect(
      await screen.findByText('Текст скопійовано. Відкрийте Threads і вставте його в новий допис.')
    ).toBeInTheDocument()
    const openThreads = screen.getByRole('button', { name: 'Відкрити Threads' })

    await fireEvent.click(openThreads)

    expect(window.open).toHaveBeenCalledWith(
      'https://www.threads.com/',
      '_blank',
      'noopener,noreferrer'
    )
    expect(writeText).toHaveBeenCalledTimes(1)
  })

  it('does not offer or open Threads when preparing the clipboard text fails', async () => {
    setClipboard(vi.fn().mockRejectedValue(new Error('Permission denied')))
    setExecCommand(() => false)
    renderDialog()

    await fireEvent.click(await screen.findByRole('button', { name: 'Threads' }))

    expect(window.open).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Відкрити Threads' })).not.toBeInTheDocument()
    expect(
      await screen.findByText('Не вдалося підготувати текст для Threads. Скопіюйте посилання окремо.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Текст скопійовано/)).not.toBeInTheDocument()
  })

  it('uses viewport-bounded panel and single-column mobile action classes', async () => {
    const { container } = renderDialog()
    await screen.findByRole('dialog')

    expect(container.querySelector('.article-share-dialog__panel')).toBeInTheDocument()
    expect(container.querySelector('.article-share-dialog__actions')).toBeInTheDocument()
    expect(container.querySelectorAll('.article-share-dialog__target')).toHaveLength(3)
    expect(container.querySelector('.article-share-dialog__feedback')).not.toBeInTheDocument()
  })

  it('renders content-specific profile heading and copy label', async () => {
    render(ShareDialog, {
      props: {
        open: true,
        canonicalUrl: 'https://proconsult.space/s/olena',
        title: 'Олена — Pro Consult',
        heading: 'Поділитися профілем',
        copyLabel: 'Копіювати посилання',
      },
    })

    expect(await screen.findByRole('dialog', { name: 'Поділитися профілем' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Копіювати посилання' })).toHaveFocus()
  })
})
