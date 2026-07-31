import { ArrowUpRight, Clock, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'
import { whatsappLink } from '../utils'

export default function Contact() {
  const { settings } = useStore()
  const phoneHref = settings.phone ? `tel:${String(settings.phone).replace(/\s/g, '')}` : ''
  const locationLabel = [settings.address, settings.city]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ') || 'Tanger, Maroc'
  const mapQuery = locationLabel || 'Tanger, Maroc'
  const whatsappHref = whatsappLink(settings.whatsapp, 'Bonjour Milan, je souhaite un conseil pour mon véhicule.')
  useSeo('Contact & accès', `Contactez ou visitez Milan Automobile Accessoires à ${settings.city || 'Tanger'}.`)
  return (
    <main className="contact-page">
      <header className="page-hero contact-heading">
        <span className="eyebrow">Parlons de votre voiture</span>
        <h1>Un conseil, une question,<br />un rendez-vous.</h1>
        <p>Envoyez le modèle et l’année de votre véhicule. Nous vous répondons avec une recommandation claire.</p>
      </header>
      <section className="contact-grid">
        {whatsappHref ? <a className="contact-primary" href={whatsappHref} target="_blank" rel="noreferrer">
          <MessageCircle />
          <div><span>WhatsApp</span><h2>Démarrer une conversation</h2><p>Le moyen le plus rapide pour vérifier un produit ou demander un devis.</p></div>
          <ArrowUpRight />
        </a> : <Link className="contact-primary" to="/catalogue">
          <MessageCircle />
          <div><span>Catalogue</span><h2>Découvrir les accessoires</h2><p>Parcourez la sélection et contactez-nous pour vérifier la compatibilité.</p></div>
          <ArrowUpRight />
        </Link>}
        <div className="contact-details">
          {phoneHref && <a href={phoneHref}><Phone /><span><small>Téléphone</small>{settings.phone}</span><ArrowUpRight /></a>}
          {settings.mapUrl && <a href={settings.mapUrl} target="_blank" rel="noreferrer"><MapPin /><span><small>Adresse</small>{locationLabel}</span><ArrowUpRight /></a>}
          <div><Clock /><span><small>Horaires</small>{settings.hours || 'Sur rendez-vous'}</span></div>
          {settings.email && <a href={`mailto:${settings.email}`}><Mail /><span><small>Email</small>{settings.email}</span><ArrowUpRight /></a>}
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer"><Instagram /><span><small>Instagram</small>@milanautomobileaccessoires</span><ArrowUpRight /></a>}
          {settings.youtube && <a href={settings.youtube} target="_blank" rel="noreferrer"><Youtube /><span><small>YouTube</small>Notre chaine</span><ArrowUpRight /></a>}
        </div>
      </section>
      <section className="map-frame">
        <iframe
          title="Localisation de Milan Automobile Accessoires"
          src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div><MapPin /><span><strong>Milan Automobile Accessoires</strong>{locationLabel}</span></div>
      </section>
    </main>
  )
}
