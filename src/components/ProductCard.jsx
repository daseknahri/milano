import { ArrowUpRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import { formatPrice, imageFallback } from '../utils'

export default function ProductCard({ product, priority = false }) {
  const { addToCart } = useStore()
  return (
    <article className="product-card">
      <Link to={`/produit/${product.slug}`} className="product-card__media">
        <img src={product.image} alt={product.name} loading={priority ? 'eager' : 'lazy'} onError={imageFallback} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <span className="product-card__view">Voir le détail <ArrowUpRight size={16} /></span>
      </Link>
      <div className="product-card__body">
        <div>
          <p>{product.category} · {product.brand}</p>
          <Link to={`/produit/${product.slug}`}><h3>{product.name}</h3></Link>
          <div className="product-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}
          </div>
        </div>
        <button className="quick-add" onClick={() => addToCart(product)} aria-label={`Ajouter ${product.name} au panier`}>
          <Plus size={20} />
        </button>
      </div>
    </article>
  )
}
