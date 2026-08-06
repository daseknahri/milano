import { ArrowLeft, ArrowRight, Check, Heart, MessageCircle, ShieldCheck, ShoppingBag, Wrench } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import PageLoader from '../components/PageLoader'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'
import { formatPrice, imageFallback, productPriceLabel, whatsappLink } from '../utils'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug } = useParams()
  const { products, categories, addToCart, settings, loading, toggleWishlist, isWishlisted } = useStore()
  const product = products.find((item) => item.slug === slug || String(item.id) === slug)
  const [gallerySelection, setGallerySelection] = useState({ productId: '', index: 0 })
  useSeo(product?.name || 'Produit', product?.description || 'Accessoire automobile Milan.', {
    image: product?.image,
    noindex: !loading && !product,
    type: product ? 'product' : 'website',
    schema: product ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: product.gallery?.length ? product.gallery : [product.image],
      description: product.description,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: Number(product.price) > 0 ? {
        '@type': 'Offer',
        priceCurrency: 'MAD',
        price: Number(product.price),
        availability: product.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: window.location.href,
      } : undefined,
    } : undefined,
  })

  if (loading && !product) return <PageLoader />
  if (!product) return <NotFound compact />
  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const categoryLabel = categories.find((item) => item.id === product.categoryId || item.name === product.category)?.name || product.category
  const vehicleModels = asList(product.vehicleModels)
  const years = asList(product.years)
  const activeImage = gallerySelection.productId === String(product.id) ? gallerySelection.index : 0
  const displayedImage = Math.min(activeImage, gallery.length - 1)
  const related = products.filter((item) => item.id !== product.id && (
    item.category === product.category ||
    (product.categoryId && item.categoryId === product.categoryId)
  )).slice(0, 3)
  const wished = isWishlisted(product.id)

  function moveGallery(direction) {
    setGallerySelection({
      productId: String(product.id),
      index: (displayedImage + direction + gallery.length) % gallery.length,
    })
  }
  const inquiry = `Bonjour Milan, je souhaite vérifier la compatibilité de « ${product.name} » avec mon véhicule.`
  const whatsappHref = whatsappLink(settings.whatsapp, inquiry)

  return (
    <main className="product-page">
      <div className="breadcrumb"><Link to="/catalogue"><ArrowLeft size={15} /> Catalogue</Link><span>/</span><span>{categoryLabel}</span></div>
      <section className="product-detail">
        <div className="product-gallery">
          <div className="product-gallery__main">
            <img src={gallery[displayedImage]} alt={`${product.name}, vue ${displayedImage + 1}`} onError={imageFallback} />
            {product.badge && <span className="product-badge">{product.badge}</span>}
            {gallery.length > 1 && (
              <div className="gallery-navigation" aria-label="Navigation de la galerie">
                <button type="button" onClick={() => moveGallery(-1)} aria-label="Image précédente"><ArrowLeft size={19} /></button>
                <span>{displayedImage + 1} / {gallery.length}</span>
                <button type="button" onClick={() => moveGallery(1)} aria-label="Image suivante"><ArrowRight size={19} /></button>
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="product-gallery__thumbs">
              {gallery.map((image, index) => (
                <button type="button" className={index === displayedImage ? 'active' : ''} onClick={() => setGallerySelection({ productId: String(product.id), index })} aria-label={`Afficher la vue ${index + 1}`} aria-pressed={index === displayedImage} key={`${image}-${index}`}>
                  <img src={image} alt={`Vue ${index + 1}`} onError={imageFallback} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <span className="eyebrow">{categoryLabel} · {product.brand}</span>
          <h1>{product.name}</h1>
          <div className="product-info__price">
            <strong>{productPriceLabel(product)}</strong>
            {Number(product.compareAtPrice) > 0 && <del>{formatPrice(product.compareAtPrice)}</del>}
          </div>
          <div className={`product-info__status ${product.inStock === false ? 'is-out' : ''}`}>
            <span aria-hidden="true" />
            {product.inStock === false ? 'Indisponible actuellement' : 'Disponible pour commande'}
          </div>
          <p className="product-info__description">{product.description}</p>
          <div className="compatibility">
            <div className="compatibility__head">
              <span>Compatibilité indicative</span>
              <small>Vérification avant installation</small>
            </div>
            <div className="compatibility__chips">
              {product.brand && <span>{product.brand}</span>}
              {vehicleModels.map((model) => <span key={model}>{model}</span>)}
              {years.map((range) => <span key={range}>{range}</span>)}
              {!vehicleModels.length && !years.length && <span>Nous consulter</span>}
            </div>
          </div>
          <ul className="feature-list">
            {product.features?.map((feature) => <li key={feature}><Check size={16} /> {feature}</li>)}
          </ul>
          <div className="product-info__actions">
            <button type="button" className="button button--accent" onClick={() => addToCart(product)} disabled={product.inStock === false}>
              <ShoppingBag size={18} /> {product.inStock === false ? 'Indisponible actuellement' : 'Ajouter à ma sélection'}
            </button>
            {whatsappHref ? <a className="button button--outline" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Vérifier la compatibilité</a> : <Link className="button button--outline" to="/contact"><MessageCircle size={18} /> Nous contacter</Link>}
            <button className={`button button--outline wishlist-action ${wished ? 'is-active' : ''}`} type="button" onClick={() => toggleWishlist(product)} aria-pressed={wished}>
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} /> {wished ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>
          </div>
          {product.inStock === false && <p className="stock-note">Disponible sur commande — contactez-nous pour le délai.</p>}
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
            <Link className="text-link" to={`/catalogue?categorie=${encodeURIComponent(product.categoryId || product.category)}`}>Tout voir <ArrowRight size={16} /></Link>
          </div>
          <div className="featured-products">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div>
        </section>
      )}
    </main>
  )
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}
