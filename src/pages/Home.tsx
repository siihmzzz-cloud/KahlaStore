import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import type { Product } from '../lib'

type Props = {
  go: (path: string) => void
  addCart: (product: Product) => void
  list: Product[]
}

export default function Home({ go, addCart, list }: Props) {
  const [sort, setSort] = useState('featured')

  const visible = useMemo(() => [...list].sort((a, b) => {
    if (sort === 'newest') return Number(!!b.newest) - Number(!!a.newest) || b.id.localeCompare(a.id)
    if (sort === 'price-low') return a.price - b.price
    if (sort === 'price-high') return b.price - a.price
    return Number(!!b.featured) - Number(!!a.featured)
  }), [sort, list])

  return (
    <main className="simple-home section-pad">
      <div className="simple-home-head" data-reveal>
        <span className="eyebrow">KA7LA / NEW COLLECTION</span>
        <h1>ALL PIECES</h1>
        <p>Everyday pieces. Made to be worn.</p>
      </div>

      <div className="simple-toolbar">
        <span className="simple-count">{visible.length} {visible.length === 1 ? 'PIECE' : 'PIECES'}</span>
        <label className="sort-select">SORT <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured</option>
          <option value="newest">New in</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
        </select></label>
      </div>

      {visible.length ? (
        <div className="product-grid">
          {visible.map((product, index) => <ProductCard key={product.id} product={product} index={index} go={go} addCart={addCart} />)}
        </div>
      ) : (
        <div className="empty-state" data-reveal>
          <h2>No pieces in this edit yet.</h2>
          <p>Try another category, or ask us about the pieces you're looking for.</p>
          <div className="empty-actions"><button className="solid-btn" onClick={() => go('/shop')}>BROWSE THE SHOP <ArrowRight size={16} /></button><button className="outline-btn" onClick={() => go('/contact')}>ASK US</button></div>
        </div>
      )}
    </main>
  )
}
