import { useCallback, useEffect, useMemo, useState } from 'react'
import { fallbackContent } from '../data/fallback'
import { referenceCategories, referenceProducts } from '../data/referenceShop'
import { StoreContext } from './store'

const asList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

const normalizeContent = (data) => {
  const savedCategories = Array.isArray(data?.categories)
    ? data.categories
    : fallbackContent.categories
  const categoryMap = new Map()
  referenceCategories.forEach((category) => categoryMap.set(category.id, category))
  savedCategories.forEach((category) => categoryMap.set(category.id, category))
  const categories = [...categoryMap.values()].sort((a, b) => (a.order || 0) - (b.order || 0))
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const savedProducts = Array.isArray(data?.products)
    ? data.products
    : fallbackContent.products
  const productMap = new Map()
  referenceProducts.forEach((product) => productMap.set(String(product.id), product))
  savedProducts.forEach((product) => productMap.set(String(product.id), product))
  const products = [...productMap.values()]

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
  const [retryKey, setRetryKey] = useState(0)
  const [cart, setCart] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('milan-cart') || '[]')
      if (!Array.isArray(stored)) return []
      return stored
        .filter((item) => item && (typeof item.id === 'string' || typeof item.id === 'number'))
        .slice(0, 50)
        .map((item) => ({ ...item, quantity: Math.min(99, Math.max(1, Number(item.quantity) || 1)) }))
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
      .then((data) => {
        setContent(normalizeContent(data))
        setUsingFallback(false)
      })
      .catch(() => setUsingFallback(true))
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [retryKey])

  useEffect(() => {
    try {
      localStorage.setItem('milan-cart', JSON.stringify(cart))
    } catch {
      // The cart remains usable in memory when storage is blocked or full.
    }
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
    if (product.inStock === false) return
    setCart((current) => {
      const found = current.find((item) => item.id === product.id)
      return found
        ? current.map((item) =>
            item.id === product.id ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item,
          )
        : [...current, { ...product, quantity: 1 }]
    })
    setCartOpen(true)
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item.id !== id)
        : current.map((item) => (item.id === id ? { ...item, quantity: Math.min(99, quantity) } : item)),
    )
  }, [])

  const retryContent = useCallback(() => {
    setLoading(true)
    setUsingFallback(false)
    setRetryKey((key) => key + 1)
  }, [])

  const value = useMemo(
    () => ({
      ...content,
      loading,
      usingFallback,
      retryContent,
      cart: hydratedCart,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      cartCount: hydratedCart.reduce((sum, item) => sum + item.quantity, 0),
    }),
    [content, loading, usingFallback, hydratedCart, cartOpen, addToCart, updateQuantity, retryContent],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
