import { ArrowUpRight, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import Logo from './Logo'

export default function Footer() {
  const { settings, categories } = useStore()
  const phoneHref = settings.phone ? `tel:${String(settings.phone).replace(/\s/g, '')}` : ''
  const locationLabel = [settings.address, settings.city]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value, index, values) => !values.some((other, otherIndex) => otherIndex < index && other.toLowerCase().includes(value.toLowerCase())))
    .join(', ') || 'Tanger, Maroc'
  return (
    <footer className="site-footer">
      <div className="footer-social">
        <span>Suivez-nous sur les reseaux sociaux</span>
        {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer"><Instagram size={18} /> @milanautomobileaccessoires</a>}
        {settings.youtube && <a href={settings.youtube} target="_blank" rel="noreferrer"><Youtube size={18} /> Notre chaine YouTube</a>}
      </div>
      <div className="footer-main footer-main--shop">
        <div className="footer-brand">
          <Logo light src={settings.logo} />
          <p>{settings.footerText || 'Specialistes des accessoires automobile, pieces de carrosserie, activation CarPlay et lumiere d ambiance.'}</p>
          <div className="footer-help">
            <span>Avez-vous besoin d aide ?</span>
            {phoneHref && <a href={phoneHref}>{settings.phone}</a>}
            {settings.hours && <small>{settings.hours}</small>}
          </div>
        </div>
        <div>
          <span className="footer-title">Service client</span>
          <Link to="/contact">Centre d aide</Link>
          <Link to="/admin">Mon compte</Link>
          <Link to="/contact">Mes commandes</Link>
          <Link to="/contact">Track Products</Link>
          <Link to="/wishlist">Liste des souhaits</Link>
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
          {categories.slice(0, 8).map((category) => <Link key={category.id} to={`/catalogue?categorie=${encodeURIComponent(category.id)}`}>{category.name}</Link>)}
        </div>
        <div className="footer-contact">
          <span className="footer-title">Contact</span>
          {phoneHref && <a href={phoneHref}><Phone size={15} /> {settings.phone}</a>}
          {settings.mapUrl && <a href={settings.mapUrl} target="_blank" rel="noreferrer"><MapPin size={15} /> {locationLabel}</a>}
          {settings.email && <a href={`mailto:${settings.email}`}><Mail size={15} /> Envoyez-nous un message</a>}
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a>}
          {settings.youtube && <a href={settings.youtube} target="_blank" rel="noreferrer">YouTube <ArrowUpRight size={13} /></a>}
        </div>
      </div>
      <div className="footer-bottom">
        <span>Copyright {new Date().getFullYear()} Milan Automobile Accessoires. All right reserved.</span>
        <span>Store - Search - Wishlist - Account - Categories</span>
      </div>
    </footer>
  )
}
