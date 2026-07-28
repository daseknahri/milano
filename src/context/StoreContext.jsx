import { useCallback, useEffect, useMemo, useState } from 'react'
import { fallbackContent } from '../data/fallback'
import { StoreContext } from './store'

const normalizeContent = (data) => ({
  settings: { ...fallbackContent.settings, ...(data?.settings || {}) },
  categories: Array.isArray(data?.categories) && data.categories.length
    ? data.categories
    : fallbackContent.categories,
  products: Array.isArray(data?.products) && data.products.length
    ? data.products
    : fallbackContent.products,
})

export function StoreProvider({ children }) {
  const [content, setContent] = useState(fallbackContent)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('milan-cart') || '[]')
    } catch {
      return []
    }
  })
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    fetch('/api/content', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Contenu indisponible')
        return response.json()
      })
      .then((data) => setContent(normalizeContent(data)))
      .catch(() => setUsingFallback(true))
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('milan-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = useCallback((product) => {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id)
      return found
        ? current.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...current, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity } : item)),
    )
  }, [])

  const value = useMemo(
    () => ({
      ...content,
      loading,
      usingFallback,
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [content, loading, usingFallback, cart, cartOpen, addToCart, updateQuantity],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
