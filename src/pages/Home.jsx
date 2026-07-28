import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight, Gauge, ShieldCheck, Wrench } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'
import { imageFallback, whatsappLink } from '../utils'

export default function Home() {
  const { settings, categories, products } = useStore()
  const heroRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const curated = products.filter((product) => product.featured)
  const featured = (curated.length ? curated : products).slice(0, 3)
  useSeo('Accessoires auto premium à Tanger', settings.heroSubtitle)

  return (
    <main>
      <section className="hero" ref={heroRef}>
        <motion.img
          className="hero__image"
          src={settings.heroImage}
          alt="Automobile premium dans un environnement urbain"
          onError={imageFallback}
          style={{ y: reduceMotion ? 0 : imageY }}
        />
        <div className="hero__shade" />
        <motion.div
          className="hero__content"
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.14 } } }}
        >
          <motion.span className="hero__overline" variants={heroItem}>Milan · Tanger</motion.span>
          <motion.h1 variants={heroItem}>{settings.heroTitle}</motion.h1>
          <motion.p variants={heroItem}>{settings.heroSubtitle}</motion.p>
          <motion.div className="hero__actions" variants={heroItem}>
            <Link className="button button--accent" to="/catalogue">Explorer la collection <ArrowRight size={18} /></Link>
            <a className="button button--glass" href={whatsappLink(settings.whatsapp, 'Bonjour Milan, je souhaite équiper mon véhicule.')} target="_blank" rel="noreferrer">
              Parler à un expert
            </a>
          </motion.div>
        </motion.div>
        <a className="hero__scroll" href="#selection"><ArrowDown size={17} /> Découvrir</a>
      </section>

      <section className="finder-strip" aria-label="Trouver un accessoire">
        <div>
          <span className="eyebrow">Votre véhicule</span>
          <h2>Commencez par ce que vous conduisez.</h2>
        </div>
        <Link to="/catalogue" className="finder-action">
          <span>Marque, modèle et année</span>
          <ChevronRight />
        </Link>
      </section>

      <section className="section section--light" id="selection">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Sélection de l’atelier</span>
            <h2>Des améliorations que l’on voit.<br />Une qualité que l’on ressent.</h2>
          </div>
          <Link className="text-link" to="/catalogue">Voir tout le catalogue <ArrowUpRight size={16} /></Link>
        </div>
        <div className="featured-products">
          {featured.map((product, index) => <ProductCard key={product.id} product={product} priority={index === 0} />)}
        </div>
      </section>

      <section className="category-editorial">
        <div className="category-intro">
          <span className="eyebrow eyebrow--light">Collections</span>
          <h2>Tout est dans<br />la finition.</h2>
          <p>Quatre univers pour révéler le caractère de votre voiture sans compromettre sa ligne.</p>
        </div>
        <div className="category-list">
          {categories.map((category, index) => (
            <Link to={`/catalogue?categorie=${encodeURIComponent(category.name)}`} className="category-row" key={category.id}>
              <span>0{index + 1}</span>
              <img src={category.image} alt="" loading="lazy" onError={imageFallback} />
              <div><h3>{category.name}</h3><p>{category.description}</p></div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </section>

      <section className="workshop-feature">
        <div className="workshop-feature__media">
          <img src={settings.aboutImage} alt="Technicien automobile au travail" loading="lazy" onError={imageFallback} />
          <span>Atelier Milan · Tanger</span>
        </div>
        <div className="workshop-feature__copy">
          <span className="eyebrow">Notre méthode</span>
          <h2>{settings.aboutTitle}</h2>
          <p>{settings.aboutText}</p>
          <ul>
            <li><Wrench /><span><strong>Montage expert</strong> Une pose propre, dédiée à votre modèle.</span></li>
            <li><ShieldCheck /><span><strong>Produits sélectionnés</strong> Testés pour durer, garantis par notre équipe.</span></li>
            <li><Gauge /><span><strong>Conseil honnête</strong> Le bon équipement, au juste niveau.</span></li>
          </ul>
          <Link className="button button--dark" to="/atelier">Découvrir l’atelier <ArrowRight size={18} /></Link>
        </div>
      </section>

      <section className="conversion">
        <span className="eyebrow eyebrow--light">Un projet en tête ?</span>
        <h2>Montrez-nous votre voiture.<br />On imagine la suite.</h2>
        <a href={whatsappLink(settings.whatsapp, 'Bonjour Milan, voici mon véhicule et mon projet :')} target="_blank" rel="noreferrer" className="button button--accent">
          Écrire sur WhatsApp <ArrowUpRight size={18} />
        </a>
        <div className="conversion__note"><Check size={16} /> Réponse rapide pendant les horaires d’ouverture</div>
      </section>
    </main>
  )
}

const heroItem = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}
