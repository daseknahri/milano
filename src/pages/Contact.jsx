import { ArrowUpRight, Clock, Instagram, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'
import { whatsappLink } from '../utils'

export default function Contact() {
  const { settings } = useStore()
  useSeo('Contact & accès', 'Contactez ou visitez Milan Automobile Accessoires à Tanger.')
  return (
    <main className="contact-page">
      <header className="page-hero contact-heading">
        <span className="eyebrow">Parlons de votre voiture</span>
        <h1>Un conseil, une question,<br />un rendez-vous.</h1>
        <p>Envoyez le modèle et l’année de votre véhicule. Nous vous répondons avec une recommandation claire.</p>
      </header>
      <section className="contact-grid">
        <a className="contact-primary" href={whatsappLink(settings.whatsapp, 'Bonjour Milan, je souhaite un conseil pour mon véhicule.')} target="_blank" rel="noreferrer">
          <MessageCircle />
          <div><span>WhatsApp</span><h2>Démarrer une conversation</h2><p>Le moyen le plus rapide pour vérifier un produit ou demander un devis.</p></div>
          <ArrowUpRight />
        </a>
        <div className="contact-details">
          <a href={`tel:${settings.phone.replace(/\s/g, '')}`}><Phone /><span><small>Téléphone</small>{settings.phone}</span><ArrowUpRight /></a>
          <a href={settings.mapUrl} target="_blank" rel="noreferrer"><MapPin /><span><small>Adresse</small>{settings.address}</span><ArrowUpRight /></a>
          <div><Clock /><span><small>Horaires</small>{settings.hours}</span></div>
          <a href={settings.instagram} target="_blank" rel="noreferrer"><Instagram /><span><small>Instagram</small>@milanautomobileaccessoires</span><ArrowUpRight /></a>
        </div>
      </section>
      <section className="map-frame">
        <iframe
          title="Localisation de Milan Automobile Accessoires"
          src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div><MapPin /><span><strong>Milan Automobile Accessoires</strong>{settings.address}</span></div>
      </section>
    </main>
  )
}
