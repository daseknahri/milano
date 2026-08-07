import { ArrowUpRight, Heart, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import { formatPrice, imageFallback, productPriceLabel } from '../utils'

export default function ProductCard({ product, priority = false }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore()
  const wished = isWishlisted(product.id)
  const fitment = [
    asList(product.vehicleModels).slice(0, 2).join(', '),
    asList(product.years).slice(0, 1).join(''),
  ].filter(Boolean).join(' · ')
  const meta = [product.category, product.brand]
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((item) => String(item).toLowerCase() === String(value).toLowerCase()) === index)
    .join(' / ')

  return (
    <article className="product-card">
      <div className="product-card__media">
        <Link to={`/produit/${product.slug}`} className="product-card__media-link" aria-label={`Voir ${product.name}`}>
          <img src={product.image} alt={product.name} loading={priority ? 'eager' : 'lazy'} onError={imageFallback} />
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <span className="product-card__view">Voir le detail <ArrowUpRight size={16} /></span>
        </Link>
        <button
          className={`wishlist-dot ${wished ? 'is-active' : ''}`}
          type="button"
          aria-label={wished ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          aria-pressed={wished}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toggleWishlist(product)
          }}
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-card__body">
        <div>
          {meta && <p>{meta}</p>}
          {fitment && <p className="product-card__fitment">Compatible : {fitment}</p>}
          <Link to={`/produit/${product.slug}`}><h3>{product.name}</h3></Link>
          <div className="product-price">
            <strong>{productPriceLabel(product)}</strong>
            {Number(product.compareAtPrice) > 0 && <del>{formatPrice(product.compareAtPrice)}</del>}
          </div>
          <span className={`stock-pill ${product.inStock === false ? 'out' : ''}`}>{product.inStock === false ? 'Indisponible' : 'Disponible'}</span>
        </div>
        <button
          className="quick-add"
          onClick={() => addToCart(product)}
          aria-label={product.inStock === false ? `${product.name} est indisponible` : `Ajouter ${product.name} au panier`}
          disabled={product.inStock === false}
        >
          <Plus size={17} aria-hidden="true" />
          <span>Ajouter</span>
        </button>
      </div>
    </article>
  )
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}
