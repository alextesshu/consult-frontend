export type PublicPageMetadata = {
  title: string
  description: string
  canonicalUrl: string
  ogType: 'profile' | 'article' | 'website'
  imageUrl: string
  imageAlt: string
  articleAuthorUrl?: string
  articlePublishedTime?: string
}

const DEFAULT_TITLE = 'Pro Consult — простір для ведення консультаційної практики'
const DEFAULT_DESCRIPTION =
  'Створіть публічну сторінку спеціаліста, приймайте запити від клієнтів і ведіть консультаційну практику.'
const DEFAULT_IMAGE_PATH = '/og-image.png?v=20260707'

export function normalizeClientMetadataText(value: unknown, maxLength = 170) {
  const parsed = new DOMParser().parseFromString(String(value || ''), 'text/html')
  const text = (parsed.body.textContent || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).replace(/[ ,.;:—-]+$/g, '')}…`
}

export function resolveClientMetadataImage(value?: string | null) {
  if (!value) return `${window.location.origin}${DEFAULT_IMAGE_PATH}`
  try {
    const resolved = new URL(value, window.location.origin)
    const localHttp =
      resolved.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(resolved.hostname)
    if (resolved.protocol !== 'https:' && !localHttp) {
      return `${window.location.origin}${DEFAULT_IMAGE_PATH}`
    }
    return resolved.toString()
  } catch {
    return `${window.location.origin}${DEFAULT_IMAGE_PATH}`
  }
}

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.dataset.proconsultMeta = 'managed'
  element.content = content
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.dataset.proconsultMeta = 'managed'
  element.href = href
}

export function applyPublicPageMetadata(metadata: PublicPageMetadata) {
  document.head
    .querySelectorAll('meta[name="robots"][data-proconsult-meta="managed"]')
    .forEach((element) => element.remove())
  document.title = metadata.title
  upsertMeta('meta[name="description"]', 'name', 'description', metadata.description)
  upsertCanonical(metadata.canonicalUrl)
  upsertMeta('meta[property="og:type"]', 'property', 'og:type', metadata.ogType)
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title)
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description)
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', metadata.canonicalUrl)
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', metadata.imageUrl)
  upsertMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', metadata.imageAlt)
  upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Pro Consult')
  upsertMeta('meta[property="og:locale"]', 'property', 'og:locale', 'uk_UA')
  upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title)
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description)
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', metadata.imageUrl)
  upsertMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', metadata.imageAlt)
  document.head.querySelectorAll('meta[property^="article:"]').forEach((element) => element.remove())
  if (metadata.ogType === 'article' && metadata.articleAuthorUrl) {
    upsertMeta(
      'meta[property="article:author"]',
      'property',
      'article:author',
      metadata.articleAuthorUrl
    )
  }
  if (metadata.ogType === 'article' && metadata.articlePublishedTime) {
    upsertMeta(
      'meta[property="article:published_time"]',
      'property',
      'article:published_time',
      metadata.articlePublishedTime
    )
  }
}

export function resetPublicPageMetadata() {
  const origin = window.location.origin
  applyPublicPageMetadata({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: `${origin}/`,
    ogType: 'website',
    imageUrl: `${origin}${DEFAULT_IMAGE_PATH}`,
    imageAlt: 'Pro Consult',
  })
}
