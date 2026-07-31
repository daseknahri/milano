import { ArrowRight, Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'

export default function Wishlist() {
  const { wishlist, wishlistCount } = useStore()
  useSeo('Ma liste de souhaits', 'Retrouvez les accessoires automobiles que vous souhaitez verifier ou commander.')

  return (
    <main className="wishlist-page">
      <header className="page-hero wishlist-heading">
        <span className="eyebrow">Votre selection</span>
        <h1>Les accessoires<br />a garder en vue.</h1>
        <p>{wishlistCount ? `${wishlistCount} article${wishlistCount === 1 ? '' : 's'} enregistre${wishlistCount === 1 ? '' : 's'}.` : 'Enregistrez les pieces qui vous interessent pour les retrouver rapidement.'}</p>
      </header>
      {wishlist.length ? (
        <section className="wishlist-results shop-section">
          <div className="shop-section-head">
            <div>
              <span className="eyebrow">Liste de souhaits</span>
              <h2>Prets a etre verifies.</h2>
            </div>
            <Link className="text-link" to="/catalogue">Continuer mes achats <ArrowRight size={16} /></Link>
          </div>
          <div className="product-grid product-grid--shop">
            {wishlist.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      ) : (
        <section className="wishlist-empty">
          <Heart size={38} strokeWidth={1.25} />
          <h2>Votre liste est encore vide.</h2>
          <p>Appuyez sur le coeur d&apos;une fiche produit pour garder une reference sous la main.</p>
          <Link className="button button--dark" to="/catalogue">Explorer la boutique <ShoppingBag size={18} /></Link>
        </section>
      )}
    </main>
  )
}
