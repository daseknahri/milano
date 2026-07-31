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
  const sort = params.get('tri') || 'featured'
  const selectedCategory = categories.find((item) => item.id === category || item.name === category)
  useSeo('Catalogue Milan Auto', 'Accessoires automobiles premium, disponibles et installes a Tanger.')

  const options = useMemo(() => {
    const inCategory = products.filter((product) => !category || matchesCategory(product, category))
    const inBrand = inCategory.filter((product) => !brand || product.brand === brand)
    const inModel = inBrand.filter((product) => !model || product.vehicleModels?.includes(model))
    return {
      brands: [...new Set(inCategory.map((product) => product.brand).filter(Boolean))].sort(),
      models: [...new Set(inBrand.flatMap((product) => product.vehicleModels || []))].sort(),
      years: [...new Set(inModel.flatMap((product) => yearOptions(product.years)))].sort((a, b) => Number(b) - Number(a)),
    }
  }, [products, category, brand, model])

  const results = useMemo(() => {
    const needle = normalizeText(query.trim())
    const filtered = products.filter((product) => {
      const haystack = normalizeText([
        product.name,
        product.brand,
        product.category,
        product.categoryId,
        product.description,
        ...(product.vehicleModels || []),
        ...(product.features || []),
      ].join(' '))
      return (!needle || haystack.includes(needle))
        && (!category || matchesCategory(product, category))
        && (!brand || product.brand === brand)
        && (!model || product.vehicleModels?.includes(model))
        && (!year || matchesYear(product.years, year))
    })
    return filtered.sort((a, b) => compareProducts(a, b, sort))
  }, [products, query, category, brand, model, year, sort])

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
  const hasFilters = Boolean(query || category || brand || model || year)
  const activeFilters = [
    query && { key: 'q', label: `Recherche : ${query}`, value: query },
    category && { key: 'categorie', label: `Categorie : ${selectedCategory?.name || category}`, value: category },
    brand && { key: 'marque', label: `Marque : ${brand}`, value: brand },
    model && { key: 'modele', label: `Modele : ${model}`, value: model },
    year && { key: 'annee', label: `Annee : ${year}`, value: year },
  ].filter(Boolean)
  const brandOptions = useMemo(() => {
    const ordered = [...referenceBrands, ...options.brands]
    return [...new Set(ordered)].filter((item) => options.brands.includes(item))
  }, [options.brands])
  const categoryOptions = categories.map((item) => ({ value: item.id, label: item.name }))

  return (
    <main className="catalog-page">
      <header className="page-hero page-hero--catalog">
        <span className="eyebrow">Boutique Milan</span>
        <h1>Pieces et accessoires<br />par voiture.</h1>
        <p>Selectionnez votre marque, modele, annee ou categorie. Notre equipe verifie chaque compatibilite avant commande et installation.</p>
      </header>
      <nav className="catalog-category-rail" aria-label="Categories populaires">
        <button
          type="button"
          className={!category ? 'active' : ''}
          onClick={() => setFilter('categorie', '')}
          aria-current={!category ? 'page' : undefined}
        >
          Toutes les categories
        </button>
        {categories.slice(0, 8).map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id || category === item.name ? 'active' : ''}
            onClick={() => setFilter('categorie', category === item.id || category === item.name ? '' : item.id)}
            aria-current={category === item.id || category === item.name ? 'page' : undefined}
          >
            {item.name}
          </button>
        ))}
      </nav>
      <div className="catalog-toolbar">
        <div className="catalog-toolbar__main">
          <label className="catalog-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Rechercher dans le catalogue</span>
            <input type="search" value={query} onChange={(event) => setFilter('q', event.target.value, true)} placeholder="Rechercher un produit, une marque..." autoComplete="off" />
            {query && <button type="button" onClick={() => setFilter('q', '', true)} aria-label="Effacer la recherche"><X size={17} /></button>}
          </label>
          <button ref={triggerRef} type="button" className="filter-toggle" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} aria-controls="catalog-filters">
            <SlidersHorizontal size={18} /> Filtres {activeFilters.length > 0 && <span className="filter-toggle__count">{activeFilters.length}</span>}
          </button>
          <label className="catalog-sort">
            <span>Trier par</span>
            <select aria-label="Trier les produits" value={sort} onChange={(event) => setFilter('tri', event.target.value, true)}>
              <option value="featured">Recommandes</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix decroissant</option>
              <option value="name">Nom A-Z</option>
            </select>
          </label>
          <span className="result-count" aria-live="polite">{results.length} reference{results.length !== 1 ? 's' : ''}</span>
        </div>
        {hasFilters && (
          <div className="catalog-active-filters" aria-label="Filtres actifs">
            <span className="catalog-active-filters__label">Actifs</span>
            {activeFilters.map((filter) => (
              <button key={filter.key} type="button" className="active-filter" onClick={() => setFilter(filter.key, '', filter.key === 'q')}>
                {filter.label}<X size={13} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className="catalog-active-filters__clear" onClick={() => setParams({})}>Tout effacer</button>
          </div>
        )}
      </div>
      <div className={`catalog-layout ${filtersOpen ? 'filters-visible' : ''}`}>
        <aside ref={overlayRef} id="catalog-filters" className="filters" aria-label="Filtres du catalogue" role={filtersOpen ? 'dialog' : undefined} aria-modal={filtersOpen || undefined} data-overlay-root={filtersOpen ? '' : undefined}>
          <div className="filters__head"><div><strong>Affiner</strong><small>{results.length} reference{results.length !== 1 ? 's' : ''} trouvee{results.length !== 1 ? 's' : ''}</small></div><button type="button" data-overlay-autofocus onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres"><X /></button></div>
          <div className="filters__brand-list">
            <span>Groupe par marque</span>
            {brandOptions.map((item) => (
              <button type="button" key={item} className={brand === item ? 'active' : ''} onClick={() => setFilter('marque', brand === item ? '' : item)} aria-pressed={brand === item}>{item}</button>
            ))}
          </div>
          <FilterSelect label="Categorie" value={selectedCategory?.id || category} onChange={(v) => setFilter('categorie', v)} options={categoryOptions} />
          <FilterSelect label="Marque" value={brand} onChange={(v) => setFilter('marque', v)} options={options.brands} />
          <FilterSelect label="Modele" value={model} onChange={(v) => setFilter('modele', v)} options={options.models} />
          <FilterSelect label="Annee" value={year} onChange={(v) => setFilter('annee', v)} options={options.years} />
          {hasFilters && <button type="button" className="clear-filters" onClick={() => setParams({})}>Tout effacer</button>}
          <div className="filter-actions">
            {hasFilters && <button type="button" className="button button--outline" onClick={() => setParams({})}>Reinitialiser</button>}
            <button type="button" className="button button--dark" onClick={() => setFiltersOpen(false)}>Voir {results.length} resultat{results.length !== 1 ? 's' : ''}</button>
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
              <button type="button" className="button button--dark" onClick={() => setParams({})}>Voir tous les produits</button>
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
        {options.map((option) => {
          const item = typeof option === 'string' ? { value: option, label: option } : option
          return <option value={item.value} key={item.value}>{item.label}</option>
        })}
      </select>
    </label>
  )
}

function matchesCategory(product, selected) {
  return product.category === selected || product.categoryId === selected
}

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function compareProducts(a, b, sort) {
  if (sort === 'price-asc') return priceValue(a) - priceValue(b)
  if (sort === 'price-desc') return priceValue(b) - priceValue(a)
  if (sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' })
  return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
}

function priceValue(product) {
  const price = Number(product.price)
  return Number.isFinite(price) && price > 0 ? price : Number.POSITIVE_INFINITY
}

function matchesYear(value, selected) {
  const target = Number(selected)
  if (!Number.isFinite(target)) return true
  const years = normalizeYears(value).map(Number).filter(Number.isFinite)
  if (!years.length) return true
  if (years.includes(target)) return true
  const min = Math.min(...years)
  const max = Math.max(...years)
  return years.length > 1 && target >= min && target <= max
}

function yearOptions(value) {
  const years = normalizeYears(value).map(Number).filter(Number.isFinite)
  if (years.length < 2) return years.map(String)
  const min = Math.min(...years)
  const max = Math.max(...years)
  if (max - min > 30) return years.map(String)
  return Array.from({ length: max - min + 1 }, (_, index) => String(min + index))
}

function normalizeYears(value) {
  const source = Array.isArray(value) ? value : [value]
  return source.filter(Boolean).flatMap((item) => String(item).match(/\d{4}/g) || [])
}
