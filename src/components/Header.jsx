import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../context/store'
import Logo from './Logo'

const links = [
  ['/', 'Accueil'],
  ['/catalogue', 'Catalogue'],
  ['/atelier', 'Notre atelier'],
  ['/contact', 'Contact'],
]

export default function Header() {
  const { settings, cartCount, setCartOpen } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <>
      <div className="announcement">{settings.announcement}</div>
      <header className="site-header">
        <Link to="/" className="brand-link"><Logo /></Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="icon-button search-button" to="/catalogue" aria-label="Rechercher">
            <Search size={19} />
          </Link>
          <button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label={`Panier, ${cartCount} articles`}>
            <ShoppingBag size={19} />
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={21} />
          </button>
        </div>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className="icon-button mobile-menu__close" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X /></button>
            <Logo light />
            <nav aria-label="Navigation mobile">
              {links.map(([to, label], index) => (
                <motion.div key={to} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <NavLink to={to} end={to === '/'} onClick={() => setMenuOpen(false)}>{label}</NavLink>
                </motion.div>
              ))}
            </nav>
            <p>{settings.address}<br />{settings.hours}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
