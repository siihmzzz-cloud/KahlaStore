import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { categoryOf } from '../lib'
import ProductCard from '../components/ProductCard'
import type { Product } from '../lib'

type Props = {
  go: (path: string) => void
  list: Product[]
  title: string
  eyebrow?: string
  addCart: (product: Product) => void
}

const priceBands = [
  { label: 'All prices', test: () => true },
  { label: 'Under 100 DT', test: (p: Product) => p.price < 100 },
  { label: '100 – 160 DT', test: (p: Product) => p.price >= 100 && p.price <= 160 },
  { label: 'Over 160 DT', test: (p: Product) => p.price > 160 },
]

export default function Shop({ go, list, title, eyebrow = 'THE COLLECTION', addCart }: Props) {
  const initial = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('category')?.toUpperCase() || 'ALL' : 'ALL'
  const [category, setCategory] = useState(initial)
  const [band, setBand] = useState(0)
  const [sort, setSort] = useState('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const categories = useMemo(() => ['ALL', ...new Set(list.map(categoryOf))], [list])
  const filtered = useMemo(() => {
    const result = list.filter((p) => (category === 'ALL' || categoryOf(p) === category) && priceBands[band].test(p))
    if (sort === 'newest') result.sort((a, b) => Number(!!b.newest) - Number(!!a.newest))
    if (sort === 'price-low') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price)
    return result
  }, [list, category, band, sort])

  const clear = () => { setCategory('ALL'); setBand(0); setSort('featured') }
  const activeFilters = (category !== 'ALL' ? 1 : 0) + (band !== 0 ? 1 : 0)

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <div className="shop-hero-noise" aria-hidden="true" />
        <div className="shop-hero-inner">
          <div className="breadcrumb"><button onClick={() => go('/')}>HOME</button><span>/</span><span>SHOP</span></div>
          <span className="section-tag">{eyebrow}</span>
          <h1>{title}</h1>
          <p>Pieces to make your own. Made for the everyday.</p>
        </div>
      </section>

      <div className="shop-body section-pad">
        <div className="shop-toolbar" data-reveal>
          <button className="filter-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> FILTERS {activeFilters > 0 && <b>{activeFilters}</b>}</button>
          <span className="shop-count">{filtered.length} {filtered.length === 1 ? 'PIECE' : 'PIECES'}</span>
          <label className="sort-select">SORT <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="featured">Featured</option><option value="newest">New in</option>
            <option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
          </select></label>
        </div>

        <div className="shop-layout">
          <aside className={`shop-filters${filtersOpen ? ' is-open' : ''}`} aria-label="Product filters">
            <div className="filter-head"><b>FILTER BY</b><button className="mobile-only" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={18} /></button></div>
            <div className="filter-group"><span className="filter-label">CATEGORY</span>
              {categories.map((item) => <button className={`filter-option${category === item ? ' is-active' : ''}`} key={item} onClick={() => setCategory(item)}><span>{item}</span><i>{category === item ? '−' : '+'}</i></button>)}
            </div>
            <div className="filter-group"><span className="filter-label">PRICE</span>
              {priceBands.map((item, index) => <button className={`filter-option${band === index ? ' is-active' : ''}`} key={item.label} onClick={() => setBand(index)}><span>{item.label}</span><i>{band === index ? '−' : '+'}</i></button>)}
            </div>
            <button className="quiet-btn" onClick={clear}>CLEAR ALL FILTERS</button>
            <div className="filter-note"><Search size={15} /><span>Looking for something else? <button onClick={() => go('/contact')}>Ask us</button></span></div>
          </aside>
          {filtersOpen && <div className="filter-backdrop" onClick={() => setFiltersOpen(false)} />}

          <div className="shop-results">
            {filtered.length ? (
              <div className="product-grid">{filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} go={go} addCart={addCart} />)}</div>
            ) : (
              <div className="empty-state" data-reveal>
                <span className="empty-icon"><Search size={26} /></span>
                <h2>Nothing here yet.</h2>
                <p>Try another edit or clear your filters to see the whole collection.</p>
                <div className="empty-actions"><button className="solid-btn" onClick={clear}>CLEAR FILTERS</button><button className="outline-btn" onClick={() => go('/')}>BACK HOME <ArrowLeft size={15} /></button></div>
              </div>
            )}
            <div className="shop-end"><span>END OF THE EDIT</span><ArrowUpRight size={16} /></div>
          </div>
        </div>
      </div>
    </main>
  )
}
