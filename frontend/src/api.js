export async function fetchCharacters({ q = '', limit = 24, offset = 0 }) {
  const params = new URLSearchParams()
  if (q.trim()) params.set('q', q.trim())
  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const res = await fetch(`/api/characters?${params.toString()}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }
  return res.json() // { results, total, count, limit, offset }
}

export function ensureHttps(url) {
  // Marvel sometimes returns http images; upgrade to https when possible
  if (!url) return ''
  if (url.startsWith('http://')) return 'https://' + url.slice(7)
  return url
}
