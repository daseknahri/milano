import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../context/store'
import { useOverlayDialog } from '../hooks/useOverlayDialog'
import Logo from './Logo'

const links = [
  ['/', 'Accueil'],
  ['/catalogue', 'Boutique'],
  ['/atelier', 'A propos'],
  ['/contact', 'Contactez-nous'],
]

export default function Header() {
  const { settings, cartCount, wishlistCount, setCartOpen } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const { overlayRef, triggerRef } = useOverlayDialog(menuOpen, () => setMenuOpen(false))
  return (
    <>
      {settings.announcement && <div className="announcement">{settings.announcement}</div>}
      <div className="top-service-bar">
        <span>{settings.phone ? `Besoin d aide ? Appelez-nous : ${settings.phone}` : 'Conseil et installation sur mesure'}</span>
        <nav aria-label="Liens rapides">
          <Link to="/atelier">A propos</Link>
          <Link to="/admin">Mon compte</Link>
          <Link to="/wishlist">Liste des souhaits</Link>
          <Link to="/contact">Order Tracking</Link>
        </nav>
      </div>
      <header className="site-header">
        <Link to="/" className="brand-link" aria-label="Milan Automobile Accessoires - accueil"><Logo src={settings.logo} /></Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="icon-button search-button" to="/catalogue" aria-label="Rechercher">
            <Search size={19} />
          </Link>
          <Link className="icon-button account-button" to="/admin" aria-label="Mon compte">
            <UserRound size={19} />
          </Link>
          <Link className="icon-button wishlist-button" to="/wishlist" aria-label={`Liste des souhaits, ${wishlistCount} articles`}>
            <Heart size={19} />
            {wishlistCount > 0 && <span>{wishlistCount}</span>}
          </Link>
          <button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={`Panier, ${cartCount} articles`}>
            <ShoppingBag size={19} />
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
          <button ref={triggerRef} className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" aria-expanded={menuOpen}>
            <Menu size={21} />
          </button>
        </div>
      </header>
      {createPortal(<AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={overlayRef}
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            data-overlay-root
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button data-overlay-autofocus className="icon-button mobile-menu__close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X /></button>
            <Logo light src={settings.logo} />
            <nav aria-label="Navigation mobile">
              {links.map(([to, label], index) => (
                <motion.div key={to} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <NavLink to={to} end={to === '/'} onClick={() => setMenuOpen(false)}>{label}</NavLink>
                </motion.div>
              ))}
            </nav>
            <div className="mobile-menu__utilities">
              <Link to="/wishlist" onClick={() => setMenuOpen(false)}><Heart size={17} /> Liste des souhaits {wishlistCount > 0 && <span>{wishlistCount}</span>}</Link>
              <Link to="/admin" onClick={() => setMenuOpen(false)}><UserRound size={17} /> Mon compte</Link>
            </div>
            <p>{settings.address || settings.city || 'Tanger, Maroc'}<br />{settings.hours || 'Sur rendez-vous'}</p>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  )
}
