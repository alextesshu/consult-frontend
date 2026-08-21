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

  it('adds and removes managed robots metadata across route transitions', () => {
    applyPublicPageMetadata({
      title: 'Знайти спеціаліста | Pro Consult',
      description: 'Каталог.',
      canonicalUrl: 'https://proconsult.space/specialists',
      ogType: 'website',
      imageUrl: 'https://proconsult.space/og-image.png',
      imageAlt: 'Pro Consult',
      robots: 'noindex, follow',
    })

    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    resetPublicPageMetadata()
    expect(document.querySelector('meta[name="robots"]')).toBeNull()
  })

  it('removes only managed JSON-LD left by server-rendered public routes', () => {
    document.head.insertAdjacentHTML(
      'beforeend',
      '<script data-proconsult-meta="managed" type="application/ld+json">{"@type":"Article"}</script>' +
        '<script id="unmanaged-json-ld" type="application/ld+json">{"@type":"WebSite"}</script>'
    )

    applyPublicPageMetadata({
      title: 'Профіль спеціаліста | Pro Consult',
      description: 'Публічна сторінка спеціаліста у Pro Consult.',
      canonicalUrl: 'https://proconsult.space/s/olena',
      ogType: 'profile',
      imageUrl: 'https://proconsult.space/og-image.png',
      imageAlt: 'Pro Consult',
    })

    expect(
      document.querySelector('script[type="application/ld+json"][data-proconsult-meta="managed"]')
    ).not.toBeNull()
    expect(document.querySelector('#unmanaged-json-ld')).not.toBeNull()

    resetPublicPageMetadata()

    expect(
      document.querySelector('script[type="application/ld+json"][data-proconsult-meta="managed"]')
    ).toBeNull()
    expect(document.querySelector('#unmanaged-json-ld')).not.toBeNull()
  })
})
