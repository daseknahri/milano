import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import { useOverlayDialog } from '../hooks/useOverlayDialog'
import { formatPrice, imageFallback, productPriceLabel, whatsappLink } from '../utils'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, settings } = useStore()
  const { overlayRef } = useOverlayDialog(cartOpen, () => setCartOpen(false))
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)
  const hasQuoteItems = cart.some((item) => !Number(item.price))
  const orderText = [
    'Bonjour Milan Automobile Accessoires, je souhaite commander :',
    ...cart.map((item) => `• ${item.name} × ${item.quantity} — ${Number(item.price) ? formatPrice(item.price * item.quantity) : productPriceLabel(item)}`),
    hasQuoteItems ? `Sous-total des articles tarifés : ${formatPrice(total)}` : `Total indicatif : ${formatPrice(total)}`,
    'Pouvez-vous me confirmer la disponibilité et l’installation ?',
  ].join('\n')

  return createPortal(
    <AnimatePresence>
      {cartOpen && (
        <div ref={overlayRef} className="drawer-layer" role="dialog" aria-modal="true" aria-label="Votre sélection" data-overlay-root>
          <motion.button
            className="drawer-backdrop"
            aria-label="Fermer le panier"
            onClick={() => setCartOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="cart-drawer"
            aria-label="Votre sélection"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <header>
              <div>
                <span className="eyebrow">Votre sélection</span>
                <h2>Panier <small>{cart.length}</small></h2>
              </div>
              <button data-overlay-autofocus className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fermer"><X /></button>
            </header>
            {cart.length ? (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <img src={item.image} alt="" onError={imageFallback} />
                      <div>
                        <Link to={`/produit/${item.slug}`} onClick={() => setCartOpen(false)}><h3>{item.name}</h3></Link>
                        <span>{productPriceLabel(item)}</span>
                        <div className="quantity">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Réduire"><Minus size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Ajouter"><Plus size={14} /></button>
                          <button className="remove" onClick={() => updateQuantity(item.id, 0)} aria-label="Supprimer"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="cart-checkout">
                  <div><span>{hasQuoteItems ? 'Devis personnalisé' : 'Total indicatif'}</span><strong>{hasQuoteItems ? 'À confirmer' : formatPrice(total)}</strong></div>
                  <p>Disponibilité et compatibilité confirmées par notre équipe avant paiement.</p>
                  <a className="button button--accent" href={whatsappLink(settings.whatsapp, orderText)} target="_blank" rel="noreferrer">
                    Commander sur WhatsApp <ArrowUpRight size={18} />
                  </a>
                </div>
              </>
            ) : (
              <div className="cart-empty">
                <ShoppingBag size={36} strokeWidth={1.4} />
                <h3>Votre sélection est vide.</h3>
                <p>Découvrez les équipements choisis par notre atelier.</p>
                <Link className="text-link" to="/catalogue" onClick={() => setCartOpen(false)}>Continuer mes achats</Link>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
