import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/store'
import { referenceBrands } from '../data/referenceShop'
import { useOverlayDialog } from '../hooks/useOverlayDialog'
import { useSeo } from '../hooks/useSeo'

export default function Catalog() {
  const { products, categories } = useStore()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { overlayRef, triggerRef } = useOverlayDialog(filtersOpen, () => setFiltersOpen(false))
  const query = params.get('q') || ''
  const category = params.get('categorie') || ''
  const brand = params.get('marque') || ''
  const model = params.get('modele') || ''
  const year = params.get('annee') || ''
  useSeo('Catalogue Milan Auto', 'Accessoires automobiles premium, disponibles et installes a Tanger.')

  const options = useMemo(() => {
    const inCategory = products.filter((product) => !category || product.category === category)
    const inBrand = inCategory.filter((product) => !brand || product.brand === brand)
    const inModel = inBrand.filter((product) => !model || product.vehicleModels?.includes(model))
    return {
      brands: [...new Set(inCategory.map((product) => product.brand).filter(Boolean))].sort(),
      models: [...new Set(inBrand.flatMap((product) => product.vehicleModels || []))].sort(),
      years: [...new Set(inModel.flatMap((product) => normalizeYears(product.years)))].sort(),
    }
  }, [products, category, brand, model])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      const haystack = [
        product.name,
        product.brand,
        product.category,
        product.categoryId,
        product.description,
        ...(product.vehicleModels || []),
        ...(product.features || []),
      ].join(' ').toLowerCase()
      return (!needle || haystack.includes(needle))
        && (!category || product.category === category)
        && (!brand || product.brand === brand)
        && (!model || product.vehicleModels?.includes(model))
        && (!year || normalizeYears(product.years).includes(year))
    })
  }, [products, query, category, brand, model, year])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 821px)')
    const closeOnDesktop = (event) => {
      if (event.matches) setFiltersOpen(false)
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  const setFilter = (key, value, replace = false) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key === 'categorie') ['marque', 'modele', 'annee'].forEach((dependent) => next.delete(dependent))
    if (key === 'marque') ['modele', 'annee'].forEach((dependent) => next.delete(dependent))
    if (key === 'modele') next.delete('annee')
    setParams(next, { replace })
  }
  const hasFilters = query || category || brand || model || year

  return (
    <main className="catalog-page">
      <header className="page-hero page-hero--catalog">
        <span className="eyebrow">Boutique Milan</span>
        <h1>Pieces et accessoires<br />par voiture.</h1>
        <p>Selectionnez votre marque, modele, annee ou categorie. Notre equipe verifie chaque compatibilite avant commande et installation.</p>
      </header>
      <nav className="catalog-category-rail" aria-label="Categories populaires">
        {categories.slice(0, 8).map((item) => (
          <button
            key={item.id}
            className={category === item.name ? 'active' : ''}
            onClick={() => setFilter('categorie', category === item.name ? '' : item.name)}
          >
            {item.name}
          </button>
        ))}
      </nav>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <Search size={19} />
          <span className="sr-only">Rechercher</span>
          <input value={query} onChange={(event) => setFilter('q', event.target.value, true)} placeholder="Rechercher un produit, une marque..." />
          {query && <button onClick={() => setFilter('q', '', true)} aria-label="Effacer"><X size={17} /></button>}
        </label>
        <button ref={triggerRef} className="filter-toggle" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} aria-controls="catalog-filters">
          <SlidersHorizontal size={18} /> Filtres
        </button>
        <span className="result-count" aria-live="polite">{results.length} reference{results.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={`catalog-layout ${filtersOpen ? 'filters-visible' : ''}`}>
        <aside ref={overlayRef} id="catalog-filters" className="filters" aria-label="Filtres du catalogue" role={filtersOpen ? 'dialog' : undefined} aria-modal={filtersOpen || undefined} data-overlay-root={filtersOpen ? '' : undefined}>
          <div className="filters__head"><strong>Affiner</strong><button data-overlay-autofocus onClick={() => setFiltersOpen(false)} aria-label="Fermer"><X /></button></div>
          <div className="filters__brand-list">
            <span>Groupe par marque</span>
            {referenceBrands.map((item) => (
              <button key={item} className={brand === item ? 'active' : ''} onClick={() => setFilter('marque', brand === item ? '' : item)}>{item}</button>
            ))}
          </div>
          <FilterSelect label="Categorie" value={category} onChange={(v) => setFilter('categorie', v)} options={categories.map((item) => item.name)} />
          <FilterSelect label="Marque" value={brand} onChange={(v) => setFilter('marque', v)} options={options.brands} />
          <FilterSelect label="Modele" value={model} onChange={(v) => setFilter('modele', v)} options={options.models} />
          <FilterSelect label="Annee" value={year} onChange={(v) => setFilter('annee', v)} options={options.years} />
          {hasFilters && <button className="clear-filters" onClick={() => setParams({})}>Tout effacer</button>}
          <div className="filter-actions">
            {hasFilters && <button className="button button--outline" onClick={() => setParams({})}>Reinitialiser</button>}
            <button className="button button--dark" onClick={() => setFiltersOpen(false)}>Voir {results.length} resultat{results.length !== 1 ? 's' : ''}</button>
          </div>
        </aside>
        <section className="catalog-results">
          {results.length ? (
            <div className="product-grid product-grid--shop">{results.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="empty-results">
              <span>0 resultat</span>
              <h2>Aucun accessoire ne correspond encore.</h2>
              <p>Modifiez les filtres ou contactez-nous : notre stock atelier contient d autres references.</p>
              <button className="button button--dark" onClick={() => setParams({})}>Voir tous les produits</button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="filter-group">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Tous</option>
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function normalizeYears(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value || '').match(/\d{4}/g) || []
}
