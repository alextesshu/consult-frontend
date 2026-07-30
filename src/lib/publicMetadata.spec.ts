import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import { applyPublicPageMetadata, resetPublicPageMetadata } from './publicMetadata'

describe('public metadata helper', () => {
  beforeEach(() => {
    document.head.querySelectorAll('[data-proconsult-meta="managed"]').forEach((item) => item.remove())
  })

  it('keeps one stable metadata marker pair in the Vite HTML entrypoint', () => {
    const indexHtml = readFileSync('index.html', 'utf8')

    expect(indexHtml.match(/<meta name="proconsult-metadata-start" content="">/g)).toHaveLength(1)
    expect(indexHtml.match(/<meta name="proconsult-metadata-end" content="">/g)).toHaveLength(1)
  })

  it('applies one canonical and matching Open Graph and Twitter metadata block', () => {
    applyPublicPageMetadata({
      title: 'Олена — Психологічна практика | Pro Consult',
      description: 'Короткий опис профілю.',
      canonicalUrl: 'https://proconsult.space/s/olena',
      ogType: 'profile',
      imageUrl: 'https://cdn.example.com/olena.jpg',
      imageAlt: 'Фото профілю Олена',
    })

    expect(document.title).toBe('Олена — Психологічна практика | Pro Consult')
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://proconsult.space/s/olena'
    )
    expect(document.querySelector('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      'Фото профілю Олена'
    )
    expect(document.querySelector('meta[name="twitter:image:alt"]')).toHaveAttribute(
      'content',
      'Фото профілю Олена'
    )
  })

  it('resets route-specific values to generic Pro Consult metadata', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta property="article:published_time" content="2026-07-30T10:00:00Z">'
    )
    resetPublicPageMetadata()

    expect(document.title).toContain('Pro Consult')
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${window.location.origin}/`
    )
    expect(document.querySelector('meta[property="article:published_time"]')).toBeNull()
  })
})
