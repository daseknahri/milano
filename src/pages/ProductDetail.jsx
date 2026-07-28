import { ArrowLeft, ArrowRight, Check, MessageCircle, ShieldCheck, ShoppingBag, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'
import { formatPrice, imageFallback, whatsappLink } from '../utils'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug } = useParams()
  const { products, addToCart, settings } = useStore()
  const product = products.find((item) => item.slug === slug || String(item.id) === slug)
  const [activeImage, setActiveImage] = useState(0)
  useSeo(product?.name || 'Produit', product?.description || 'Accessoire automobile Milan.')

  if (!product) return <NotFound compact />
  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const related = products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 3)
  const inquiry = `Bonjour Milan, je souhaite vérifier la compatibilité de « ${product.name} » avec mon véhicule.`

  return (
    <main className="product-page">
      <div className="breadcrumb"><Link to="/catalogue"><ArrowLeft size={15} /> Catalogue</Link><span>/</span><span>{product.category}</span></div>
      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-gallery__main">
            <img src={gallery[activeImage]} alt={`${product.name}, vue ${activeImage + 1}`} onError={imageFallback} />
            {product.badge && <span className="product-badge">{product.badge}</span>}
          </div>
          {gallery.length > 1 && (
            <div className="product-gallery__thumbs">
              {gallery.map((image, index) => (
                <button className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} key={image}>
                  <img src={image} alt={`Vue ${index + 1}`} onError={imageFallback} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <span className="eyebrow">{product.category} · {product.brand}</span>
          <h1>{product.name}</h1>
          <div className="product-info__price">
            <strong>{formatPrice(product.price)}</strong>
            {product.compareAtPrice && <del>{formatPrice(product.compareAtPrice)}</del>}
          </div>
          <p className="product-info__description">{product.description}</p>
          <div className="compatibility">
            <span>Compatibilité indicative</span>
            <p>{product.vehicleModels?.join(' · ') || 'Nous consulter'}</p>
            <small>{product.years?.join(' · ')}</small>
          </div>
          <ul className="feature-list">
            {product.features?.map((feature) => <li key={feature}><Check size={16} /> {feature}</li>)}
          </ul>
          <div className="product-info__actions">
            <button className="button button--accent" onClick={() => addToCart(product)}>
              <ShoppingBag size={18} /> Ajouter à ma sélection
            </button>
            <a className="button button--outline" href={whatsappLink(settings.whatsapp, inquiry)} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Vérifier la compatibilité
            </a>
          </div>
          {!product.inStock && <p className="stock-note">Disponible sur commande — contactez-nous pour le délai.</p>}
          <div className="product-assurance">
            <span><Wrench /> Installation possible à l’atelier</span>
            <span><ShieldCheck /> Produits contrôlés et garantis</span>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="related section section--light">
          <div className="section-heading">
            <div><span className="eyebrow">Même univers</span><h2>À considérer aussi.</h2></div>
            <Link className="text-link" to={`/catalogue?categorie=${encodeURIComponent(product.category)}`}>Tout voir <ArrowRight size={16} /></Link>
          </div>
          <div className="featured-products">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div>
        </section>
      )}
    </main>
  )
}
