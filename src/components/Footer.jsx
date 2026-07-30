import { ArrowUpRight, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import Logo from './Logo'

export default function Footer() {
  const { settings, categories } = useStore()
  return (
    <footer className="site-footer">
      <div className="footer-social">
        <span>Suivez-nous sur les reseaux sociaux</span>
        <a href={settings.instagram} target="_blank" rel="noreferrer"><Instagram size={18} /> @milanautomobileaccessoires</a>
      </div>
      <div className="footer-main footer-main--shop">
        <div className="footer-brand">
          <Logo light />
          <p>Specialistes des accessoires automobile, pieces de carrosserie, activation CarPlay et lumiere d ambiance.</p>
          <div className="footer-help">
            <span>Avez-vous besoin d aide ?</span>
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
            <small>{settings.hours}</small>
          </div>
        </div>
        <div>
          <span className="footer-title">Service client</span>
          <Link to="/contact">Centre d aide</Link>
          <Link to="/admin">Mon compte</Link>
          <Link to="/contact">Mes commandes</Link>
          <Link to="/contact">Track Products</Link>
          <Link to="/catalogue">Liste des souhaits</Link>
        </div>
        <div>
          <span className="footer-title">Liens utiles</span>
          <Link to="/atelier">A propos</Link>
          <Link to="/catalogue">Promotions</Link>
          <Link to="/atelier">Qui sommes-nous ?</Link>
          <span>Livraison partout au Maroc</span>
          <span>Livraison gratuite a Tanger</span>
        </div>
        <div>
          <span className="footer-title">Category Menu</span>
          {categories.slice(0, 8).map((category) => <Link key={category.id} to={`/catalogue?categorie=${encodeURIComponent(category.name)}`}>{category.name}</Link>)}
        </div>
        <div className="footer-contact">
          <span className="footer-title">Contact</span>
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`}><Phone size={15} /> {settings.phone}</a>
          <a href={settings.mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} /> {settings.address}</a>
          <a href={settings.email ? `mailto:${settings.email}` : settings.instagram} target="_blank" rel="noreferrer"><Mail size={15} /> Envoyez-nous un message</a>
          <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Copyright {new Date().getFullYear()} Milan Automobile Accessoires. All right reserved.</span>
        <span>Store - Search - Wishlist - Account - Categories</span>
      </div>
    </footer>
  )
}
