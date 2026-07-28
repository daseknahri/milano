import { ArrowUpRight, Instagram, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import Logo from './Logo'

export default function Footer() {
  const { settings, categories } = useStore()
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Logo light />
          <p>Accessoires sélectionnés. Installation précise. Service personnel à Tanger.</p>
        </div>
        <div>
          <span className="footer-title">Explorer</span>
          <Link to="/catalogue">Tout le catalogue</Link>
          {categories.slice(0, 3).map((category) => <Link key={category.id} to={`/catalogue?categorie=${encodeURIComponent(category.name)}`}>{category.name}</Link>)}
        </div>
        <div>
          <span className="footer-title">Milan</span>
          <Link to="/atelier">Notre atelier</Link>
          <Link to="/contact">Contact & accès</Link>
          <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a>
        </div>
        <div className="footer-contact">
          <span className="footer-title">Nous trouver</span>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`}><Phone size={15} /> {settings.phone}</a>
          <a href={settings.mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} /> {settings.address}</a>
          <a href={settings.instagram} target="_blank" rel="noreferrer"><Instagram size={15} /> @milanautomobileaccessoires</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Milan Automobile Accessoires</span>
        <span>Conçu pour la route.</span>
      </div>
    </footer>
  )
}
