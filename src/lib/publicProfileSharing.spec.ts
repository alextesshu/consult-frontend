import { describe, expect, it } from 'vitest'
import { canonicalPublicProfileShareUrl, publicProfileShareTargets } from './publicProfileSharing'

describe('canonical public profile sharing', () => {
  it.each(['olena', 'specialist-2', 'олена_київ'])('uses the production profile route for %s', (slug) => {
    expect(canonicalPublicProfileShareUrl(slug)).toBe(`https://proconsult.space/s/${encodeURIComponent(slug)}`)
  })
  it.each(['', ' ', '../admin', 'x/y', 'x?token=secret', 'x#slots', 'https://localhost/s/x'])('rejects a non-slug %s', (slug) => {
    expect(canonicalPublicProfileShareUrl(slug)).toBe('')
  })
  it('encodes URL and text independently in the supported share endpoints', () => {
    const url = canonicalPublicProfileShareUrl('олена'), name = 'Олена & Андрій? #консультація'
    const links = publicProfileShareTargets(url, name)
    const telegram = new URL(links.telegram), facebook = new URL(links.facebook), threads = new URL(links.threads)
    expect(telegram.origin + telegram.pathname).toBe('https://t.me/share/url')
    expect(telegram.searchParams.get('url')).toBe(url)
    expect(telegram.searchParams.get('text')).toBe(name)
    expect(facebook.origin + facebook.pathname).toBe('https://www.facebook.com/sharer/sharer.php')
    expect(facebook.searchParams.get('u')).toBe(url)
    expect(threads.origin + threads.pathname).toBe('https://www.threads.com/intent/post')
    expect(threads.searchParams.get('url')).toBe(url)
    expect(threads.searchParams.get('text')).toBe(name)
    for (const link of Object.values(links)) expect(link).not.toMatch(/localhost|staging|intent=request/)
  })
})
