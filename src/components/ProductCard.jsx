import { ArrowUpRight, Heart, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import { formatPrice, imageFallback, productPriceLabel } from '../utils'

export default function ProductCard({ product, priority = false }) {
  const { addToCart } = useStore()
  return (
    <article className="product-card">
      <Link to={`/produit/${product.slug}`} className="product-card__media">
        <img src={product.image} alt={product.name} loading={priority ? 'eager' : 'lazy'} onError={imageFallback} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <span className="wishlist-dot" aria-hidden="true"><Heart size={16} /></span>
        <span className="product-card__view">Voir le detail <ArrowUpRight size={16} /></span>
      </Link>
      <div className="product-card__body">
        <div>
          <p>{product.category} / {product.brand}</p>
          <Link to={`/produit/${product.slug}`}><h3>{product.name}</h3></Link>
          <div className="product-price">
            <strong>{productPriceLabel(product)}</strong>
            {Number(product.compareAtPrice) > 0 && <del>{formatPrice(product.compareAtPrice)}</del>}
          </div>
          <span className={`stock-pill ${product.inStock === false ? 'out' : ''}`}>{product.inStock === false ? 'Out of stock' : 'In Stock'}</span>
        </div>
        <button
          className="quick-add"
          onClick={() => addToCart(product)}
          aria-label={product.inStock === false ? `${product.name} est indisponible` : `Ajouter ${product.name} au panier`}
          disabled={product.inStock === false}
        >
          <Plus size={20} />
        </button>
      </div>
    </article>
  )
}
