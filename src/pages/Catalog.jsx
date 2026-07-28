import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/store'
import { useSeo } from '../hooks/useSeo'

export default function Catalog() {
  const { products, categories } = useStore()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const query = params.get('q') || ''
  const category = params.get('categorie') || ''
  const brand = params.get('marque') || ''
  const model = params.get('modele') || ''
  const year = params.get('annee') || ''
  useSeo('Catalogue', 'Accessoires automobiles premium, disponibles et installés à Tanger.')

  const options = useMemo(() => ({
    brands: [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(),
    models: [...new Set(products.flatMap((p) => p.vehicleModels || []))].sort(),
    years: [...new Set(products.flatMap((p) => p.years || []))].sort(),
  }), [products])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((product) => {
      const haystack = [product.name, product.brand, product.category, ...(product.vehicleModels || []), ...(product.features || [])].join(' ').toLowerCase()
      return (!needle || haystack.includes(needle))
        && (!category || product.category === category)
        && (!brand || product.brand === brand)
        && (!model || product.vehicleModels?.includes(model))
        && (!year || product.years?.includes(year))
    })
  }, [products, query, category, brand, model, year])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    setParams(next)
  }
  const hasFilters = query || category || brand || model || year

  return (
    <main className="catalog-page">
      <header className="page-hero page-hero--catalog">
        <span className="eyebrow">La collection Milan</span>
        <h1>L’équipement juste,<br />pour votre voiture.</h1>
        <p>Découvrez nos références et filtrez par véhicule. Notre équipe vérifie chaque compatibilité avant installation.</p>
      </header>
      <div className="catalog-toolbar">
        <label className="catalog-search">
          <Search size={19} />
          <span className="sr-only">Rechercher</span>
          <input value={query} onChange={(event) => setFilter('q', event.target.value)} placeholder="Rechercher un produit, une marque…" />
          {query && <button onClick={() => setFilter('q', '')} aria-label="Effacer"><X size={17} /></button>}
        </label>
        <button className="filter-toggle" onClick={() => setFiltersOpen((value) => !value)}>
          <SlidersHorizontal size={18} /> Filtres
        </button>
        <span className="result-count">{results.length} référence{results.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={`catalog-layout ${filtersOpen ? 'filters-visible' : ''}`}>
        <aside className="filters" aria-label="Filtres du catalogue">
          <div className="filters__head"><strong>Affiner</strong><button onClick={() => setFiltersOpen(false)} aria-label="Fermer"><X /></button></div>
          <FilterSelect label="Catégorie" value={category} onChange={(v) => setFilter('categorie', v)} options={categories.map((item) => item.name)} />
          <FilterSelect label="Marque" value={brand} onChange={(v) => setFilter('marque', v)} options={options.brands} />
          <FilterSelect label="Modèle" value={model} onChange={(v) => setFilter('modele', v)} options={options.models} />
          <FilterSelect label="Année" value={year} onChange={(v) => setFilter('annee', v)} options={options.years} />
          {hasFilters && <button className="clear-filters" onClick={() => setParams({})}>Tout effacer</button>}
        </aside>
        <section className="catalog-results">
          {results.length ? (
            <div className="product-grid">{results.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          ) : (
            <div className="empty-results">
              <span>0 résultat</span>
              <h2>Aucun accessoire ne correspond encore.</h2>
              <p>Modifiez les filtres ou contactez-nous : notre stock atelier contient d’autres références.</p>
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
