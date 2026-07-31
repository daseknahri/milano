import { useEffect } from 'react'

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
}

export function useSeo(title, description, options = {}) {
  const { image, noindex = false, schema, type = 'website' } = options
  const schemaKey = schema ? JSON.stringify(schema) : ''

  useEffect(() => {
    const brandName = 'Milan Automobile Accessoires'
    const fullTitle = title?.toLocaleLowerCase().includes(brandName.toLocaleLowerCase())
      ? title
      : `${title} — ${brandName}`
    const canonicalUrl = new URL(window.location.pathname, window.location.origin).href
    const absoluteImage = toAbsoluteUrl(image)
    document.title = fullTitle

    upsertMeta('meta[name="description"]', { name: 'description', content: description || '' })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description || '' })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: absoluteImage ? 'summary_large_image' : 'summary' })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description || '' })
    if (absoluteImage) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: absoluteImage })
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: absoluteImage })
    }

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    const previousSchema = document.getElementById('page-json-ld')
    previousSchema?.remove()
    if (schemaKey) {
      const script = document.createElement('script')
      script.id = 'page-json-ld'
      script.type = 'application/ld+json'
      script.textContent = schemaKey.replaceAll('<', '\\u003c')
      document.head.appendChild(script)
    }
  }, [title, description, image, noindex, schemaKey, type])
}

function toAbsoluteUrl(value) {
  if (!value) return ''
  try {
    const parsed = new URL(value, window.location.origin)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}
