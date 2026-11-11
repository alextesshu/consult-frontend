// Public sharing always targets the canonical site, including from local/staging previews.
export function canonicalPublicProfileShareUrl(slug: string | null | undefined): string {
  const value = String(slug || '').trim()
  if (!value || !/^[\p{L}\p{N}_-]+$/u.test(value)) return ''
  return `https://proconsult.space/s/${encodeURIComponent(value)}`
}

export function publicProfileShareTargets(url: string, name: string) {
  const encodedUrl = encodeURIComponent(url)
  const encodedName = encodeURIComponent(name)
  return {
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedName}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    threads: `https://www.threads.com/intent/post?text=${encodedName}&url=${encodedUrl}`,
  }
}
