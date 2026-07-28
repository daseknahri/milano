import { useEffect } from 'react'

export function useSeo(title, description) {
  useEffect(() => {
    document.title = `${title} — Milan Automobile Accessoires`
    const meta = document.querySelector('meta[name="description"]')
    if (meta && description) meta.setAttribute('content', description)
  }, [title, description])
}

