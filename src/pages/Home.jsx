import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  CheckCircle2,
  Headphones,
  Play,
  Search,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, createSearchParams, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/store'
import { finderMakes, referenceBrands, referencePartners } from '../data/referenceShop'
import { useSeo } from '../hooks/useSeo'
import { imageFallback, whatsappLink } from '../utils'

const years = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']

export default function Home() {
  const { settings, categories, products } = useStore()
  const heroRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const [finder, setFinder] = useState({ marque: '', modele: '', annee: '', q: '' })
  const models = finder.marque ? finderMakes[finder.marque] || [] : []
  const topCategories = categories.slice(0, 8)
  const featured = products.filter((product) => product.featured).slice(0, 8)
  const weekly = products
    .filter((product) => Number(product.compareAtPrice) > Number(product.price) && Number(product.price) > 0)
    .slice(0, 4)
  const popular = products.filter((product) => ['VOLKSWAGEN', 'AUDI'].includes(product.brand)).slice(0, 6)
  const special = weekly[0] || featured[0] || products[0]
  const heroHref = normalizeHeroHref(settings.heroCtaHref)
  const videoUrl = settings.youtube || settings.instagram
  const videoLabel = settings.youtube ? 'Voir la chaine' : 'Voir les nouveautes'
  const whatsappHref = whatsappLink(settings.whatsapp, 'Bonjour Milan, je cherche un accessoire compatible avec ma voiture.')
  const finderParams = createSearchParams(Object.fromEntries(
    Object.entries(finder).filter(([, value]) => value),
  )).toString()
  const finderTarget = finderParams ? `/catalogue?${finderParams}` : '/catalogue'

  useSeo(
    settings.seoTitle || 'Accessoires auto premium au Maroc',
    settings.seoDescription || settings.heroSubtitle,
    {
      image: settings.heroImage,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'AutomotiveBusiness',
        name: settings.brandName || 'Milan Automobile Accessoires',
        image: settings.heroImage,
        telephone: settings.phone,
        address: settings.address,
        url: window.location.origin,
        sameAs: settings.instagram ? [settings.instagram] : [],
      },
    },
  )

  return (
    <main>
      <section className="shop-hero" ref={heroRef}>
        <motion.img
          className="shop-hero__image"
          src={settings.heroImage}
          alt="Accessoires automobiles premium"
          fetchPriority="high"
          onError={imageFallback}
          style={{ y: reduceMotion ? 0 : imageY }}
        />
        <div className="shop-hero__shade" />
        <motion.div
          className="shop-hero__content"
          initial={reduceMotion ? false : 'hidden'}
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } } }}
        >
          <motion.span className="hero__overline" variants={heroItem}>{settings.eyebrow || 'Milan Auto Accessoires'}</motion.span>
          <motion.h1 variants={heroItem}>{settings.heroTitle || 'Trouvez vos produits rapidement'}</motion.h1>
          <motion.p variants={heroItem}>{settings.heroSubtitle || 'Chercher les produits et accessoires de votre voiture pour ameliorer le confort, le style et la technologie de voyage.'}</motion.p>
          <motion.div className="hero__actions" variants={heroItem}>
            <HeroAction href={heroHref} label={settings.heroCtaLabel || 'Boutique'} />
            {whatsappHref ? <a className="button button--glass" href={whatsappHref} target="_blank" rel="noreferrer">Besoin d aide</a> : <Link className="button button--glass" to="/contact">Besoin d aide</Link>}
          </motion.div>
        </motion.div>
        <ProductFinder finder={finder} models={models} setFinder={setFinder} target={finderTarget} />
        <a className="hero__scroll" href="#categories"><ArrowDown size={17} /> Categories</a>
      </section>

      <section className="trust-strip" aria-label="Services">
        <span><Truck size={18} /> Livraison partout au Maroc</span>
        <span><Headphones size={18} /> Conseil par telephone et WhatsApp</span>
        <span><Wrench size={18} /> Installation professionnelle</span>
        <span><ShieldCheck size={18} /> Compatibilite verifiee</span>
      </section>

      <section className="shop-section" id="categories">
        <SectionHead eyebrow="Meilleures categories" title="Ne manquez pas les offres de cette semaine" action="Afficher tout" to="/catalogue" />
        <div className="best-category-grid">
          {topCategories.map((category) => (
            <Link className="best-category" to={`/catalogue?categorie=${encodeURIComponent(category.id)}`} key={category.id}>
              <img src={category.image} alt="" loading="lazy" onError={imageFallback} />
              <span>{category.name}</span>
              <small>{categoryMeta(category, products)}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="brand-shelf">
        <SectionHead eyebrow="Groupe par marque" title="Choisissez votre univers automobile" action="Afficher tout" to="/catalogue" light />
        <div className="brand-tabs">
          {referenceBrands.map((brand) => <Link key={brand} to={`/catalogue?marque=${encodeURIComponent(brand)}`}>{brand}</Link>)}
        </div>
        <div className="product-grid product-grid--shop">
          {(popular.length ? popular : products).slice(0, 8).map((product, index) => <ProductCard key={product.id} product={product} priority={index < 2} />)}
        </div>
      </section>

      <section className="shop-section">
        <SectionHead eyebrow="Offres de la semaine" title="Pieces populaires, prix visibles, commande rapide" action="Afficher tout" to="/catalogue" />
        <div className="product-grid product-grid--shop">
          {(weekly.length ? weekly : featured).slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {special && (
        <section className="deal-band">
          <div>
            <span className="eyebrow eyebrow--light">Offre speciale pour vous</span>
            <h2>{special.name}</h2>
            <p>Il ne reste plus beaucoup de temps. Contactez Milan pour verifier la compatibilite et reserver l installation.</p>
            <Link className="button button--accent" to={`/produit/${special.slug}`}>Voir le produit <ArrowUpRight size={18} /></Link>
          </div>
          <img src={special.image} alt={special.name} loading="lazy" onError={imageFallback} />
          <div className="deal-band__price">
            <BadgePercent />
            <strong>{special.priceLabel || `${Number(special.price).toLocaleString('fr-MA')} DH`}</strong>
            <span>In Stock</span>
          </div>
        </section>
      )}

      <section className="video-strip">
        <div>
          <span className="eyebrow">Notre chaine YouTube</span>
          <h2>Premiere chaine marocaine dediee au test drive et aux upgrades auto.</h2>
        </div>
        {videoUrl ? <a className="play-button" href={videoUrl} target="_blank" rel="noreferrer"><Play size={20} /> {videoLabel}</a> : <Link className="play-button" to="/catalogue"><Play size={20} /> Decouvrir la boutique</Link>}
      </section>

      <section className="shop-section">
        <SectionHead eyebrow="Univers populaires" title="Pour acheter vos produits preferes" action="Afficher tout" to="/catalogue" />
        <div className="product-grid product-grid--shop">
          {(featured.length ? featured : products).slice(0, 6).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="partners">
        <span className="eyebrow">Nos partenaires</span>
        <h2>Nos marques principales</h2>
        <div>{referencePartners.map((partner) => <span key={partner}>{partner}</span>)}</div>
      </section>

      <section className="social-follow">
        <span className="eyebrow eyebrow--light">Suivez-nous sur les reseaux sociaux</span>
        <h2>@milanautomobileaccessoires</h2>
        {settings.instagram ? <a className="button button--accent" href={settings.instagram} target="_blank" rel="noreferrer">Voir Instagram <ArrowUpRight size={18} /></a> : <Link className="button button--accent" to="/contact">Nous contacter <ArrowUpRight size={18} /></Link>}
        <div className="conversion__note"><CheckCircle2 size={16} /> Nouveaux produits, installations et arrivages</div>
      </section>
    </main>
  )
}

function ProductFinder({ finder, models, setFinder, target }) {
  const navigate = useNavigate()
  const submitFinder = (event) => {
    event.preventDefault()
    navigate(target)
  }
  const submitOnEnter = (event) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    navigate(target)
  }
  const update = (key, value) => setFinder((current) => ({
    ...current,
    [key]: value,
    ...(key === 'marque' ? { modele: '' } : {}),
  }))

  return (
    <motion.form className="product-finder" variants={heroItem} onSubmit={submitFinder}>
      <div className="product-finder__head">
        <Search size={18} />
        <span>Veuillez selectionner la marque et modele de votre voiture.</span>
      </div>
      <select value={finder.marque} onChange={(event) => update('marque', event.target.value)} aria-label="Marque">
        <option value="">Marque</option>
        {Object.keys(finderMakes).map((make) => <option key={make} value={make}>{make}</option>)}
      </select>
      <select value={finder.modele} onChange={(event) => update('modele', event.target.value)} aria-label="Modele" disabled={!finder.marque}>
        <option value="">Modele</option>
        {models.map((model) => <option key={model} value={model}>{model}</option>)}
      </select>
      <input value={finder.q} onChange={(event) => update('q', event.target.value)} onKeyDown={submitOnEnter} placeholder="Nom du produit" aria-label="Nom du produit" />
      <select value={finder.annee} onChange={(event) => update('annee', event.target.value)} aria-label="Annee">
        <option value="">Annee</option>
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
      <button type="submit" className="button button--accent">Chercher votre produit</button>
    </motion.form>
  )
}

function HeroAction({ href, label }) {
  const content = <>{label} <ArrowRight size={18} /></>
  if (/^https?:\/\//i.test(href)) {
    return <a className="button button--accent" href={href} target="_blank" rel="noreferrer">{content}</a>
  }
  return <Link className="button button--accent" to={href}>{content}</Link>
}

function normalizeHeroHref(value) {
  const href = String(value || '').trim()
  if (href === '#collections') return '#categories'
  if (href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//'))) return href
  if (/^https?:\/\//i.test(href)) return href
  return '/catalogue'
}

function SectionHead({ eyebrow, title, action, to, light = false }) {
  return (
    <div className={`shop-section-head ${light ? 'shop-section-head--light' : ''}`}>
      <div>
        <span className={light ? 'eyebrow eyebrow--light' : 'eyebrow'}>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Link className="text-link" to={to}>{action} <ArrowUpRight size={16} /></Link>
    </div>
  )
}

const heroItem = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

function categoryMeta(category, products) {
  const count = products.filter((product) => product.category === category.name || product.categoryId === category.id).length
  return count ? `${count} reference${count === 1 ? '' : 's'}` : 'Disponible sur demande'
}
