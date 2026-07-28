import { useCallback, useEffect, useMemo, useState } from 'react'
import { fallbackContent } from '../data/fallback'
import { StoreContext } from './store'

const asList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

const normalizeContent = (data) => {
  const categories = Array.isArray(data?.categories) && data.categories.length
    ? data.categories
    : fallbackContent.categories
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const products = Array.isArray(data?.products) && data.products.length
    ? data.products
    : fallbackContent.products

  return {
    settings: { ...fallbackContent.settings, ...(data?.settings || {}) },
    categories,
    products: products.map((product) => {
      const image = product.image || product.images?.[0] || ''
      const gallery = [...new Set([
        image,
        ...(asList(product.gallery).length ? asList(product.gallery) : asList(product.images)),
      ].filter(Boolean))]
      return {
        ...product,
        categoryId: product.categoryId || product.category,
        category: categoryNames.get(product.categoryId || product.category) || product.category || 'Collection Milan',
        vehicleModels: asList(product.vehicleModels),
        years: asList(product.years),
        features: asList(product.features),
        image,
        gallery,
      }
    }),
  }
}

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

  const hydratedCart = useMemo(() => {
    if (loading) return cart
    const currentProducts = new Map(content.products.map((product) => [String(product.id), product]))
    return cart
      .map((item) => {
        const latest = currentProducts.get(String(item.id))
        return latest ? { ...latest, quantity: item.quantity } : null
      })
      .filter(Boolean)
  }, [cart, content.products, loading])

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
      cart: hydratedCart,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      cartCount: hydratedCart.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [content, loading, usingFallback, hydratedCart, cartOpen, addToCart, updateQuantity],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
