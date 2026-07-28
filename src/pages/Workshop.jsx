import { ArrowUpRight, CheckCircle2, Clock, Sparkles, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'
import { imageFallback, whatsappLink } from '../utils'

export default function Workshop() {
  const { settings } = useStore()
  useSeo('Notre atelier', 'Découvrez la méthode et le savoir-faire de Milan Automobile Accessoires à Tanger.')
  return (
    <main className="workshop-page">
      <section className="workshop-hero">
        <img src={settings.aboutImage} alt="L’atelier Milan Automobile Accessoires" onError={imageFallback} />
        <div className="workshop-hero__shade" />
        <div className="workshop-hero__content">
          <span className="eyebrow eyebrow--light">Atelier · Tanger</span>
          <h1>Le beau geste.<br />La bonne finition.</h1>
          <p>Nous ne posons pas simplement un accessoire. Nous l’intégrons à votre voiture.</p>
        </div>
      </section>
      <section className="atelier-story">
        <div>
          <span className="eyebrow">Notre exigence</span>
          <h2>{settings.aboutTitle}</h2>
        </div>
        <div>
          <p>{settings.aboutText}</p>
          <p>Du premier conseil au dernier contrôle, un même technicien suit votre projet. Le résultat doit être propre, fiable et naturel — comme si l’accessoire avait toujours fait partie du véhicule.</p>
        </div>
      </section>
      <section className="process">
        <span className="eyebrow eyebrow--light">Une méthode simple</span>
        <div className="process__steps">
          <article><span>01</span><Wrench /><h3>Diagnostic</h3><p>Nous identifions votre modèle, vos attentes et la solution adaptée.</p></article>
          <article><span>02</span><Sparkles /><h3>Installation</h3><p>Pose précise, câblage propre et respect intégral des finitions.</p></article>
          <article><span>03</span><CheckCircle2 /><h3>Contrôle</h3><p>Test complet, réglages et prise en main avec vous.</p></article>
        </div>
      </section>
      <section className="visit-strip">
        <div><Clock /><span><small>Horaires atelier</small>{settings.hours}</span></div>
        <div>
          <h2>Votre projet mérite un œil expert.</h2>
          <p>Passez à l’atelier ou envoyez-nous une photo de votre voiture.</p>
        </div>
        <a href={whatsappLink(settings.whatsapp, 'Bonjour Milan, je souhaite prendre rendez-vous à l’atelier.')} target="_blank" rel="noreferrer" className="button button--dark">
          Prendre rendez-vous <ArrowUpRight size={18} />
        </a>
      </section>
      <div className="center-link"><Link className="text-link" to="/catalogue">Découvrir les équipements <ArrowUpRight size={16} /></Link></div>
    </main>
  )
}
