export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Sur devis'
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function productPriceLabel(product) {
  if (product?.priceLabel) return product.priceLabel
  if (!Number(product?.price)) return 'Sur devis'
  return formatPrice(product.price)
}

export function whatsappLink(number, message) {
  const clean = String(number || '').replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function imageFallback(event) {
  event.currentTarget.onerror = null
  event.currentTarget.src = '/assets/hero-milan-night.webp'
}

