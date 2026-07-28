export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return 'Sur demande'
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function whatsappLink(number, message) {
  const clean = String(number || '').replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function imageFallback(event) {
  event.currentTarget.onerror = null
  event.currentTarget.src =
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80'
}

