import { ArrowUpRight, Plus } from 'lucide-react'
import { activeDiscountPercent, categoryOf, money, productImages } from '../lib'
import type { Product } from '../lib'

type Props = {
  product: Product
  index: number
  go: (path: string) => void
  addCart: (product: Product) => void
}

export default function ProductCard({ product: p, index, go, addCart }: Props) {
  const images = productImages(p)
  const discount = activeDiscountPercent(p)
  const soldOut = p.stock === 0

  return (
    <article className="p-card" data-reveal>
      <div className="p-card-media">
        <button className="p-card-open" onClick={() => go(`/product/${p.slug}`)} aria-label={`View ${p.name}`}>
          <img src={images[0]} alt={p.name} loading="lazy" />
          {images[1] && <img className="p-card-alt" src={images[1]} alt="" loading="lazy" />}
        </button>
        <span className="p-card-num">{String(index + 1).padStart(2, '0')}</span>
        <div className="p-card-badges">
          {soldOut && <span className="tag tag-dark">SOLD OUT</span>}
          {discount > 0 && <span className="tag tag-acid">−{discount}%</span>}
          {p.newest && !soldOut && <span className="tag tag-light">NEW IN</span>}
        </div>
        <button className="p-card-add" onClick={() => addCart(p)} disabled={soldOut} aria-label={soldOut ? `${p.name} is sold out` : `Quick add ${p.name} to bag`}>
          <span className="p-card-add-label">{soldOut ? 'SOLD OUT' : 'QUICK ADD'}</span>
          {!soldOut && <Plus size={17} />}
        </button>
      </div>
      <div className="p-card-foot">
        <div className="p-card-ident">
          <h3>{p.name}</h3>
          <span>{categoryOf(p)}</span>
        </div>
        <div className="p-card-price">
          <strong>{money(p.price)}</strong>
          {discount > 0 && <s>{money(p.compareAtPrice || p.price)}</s>}
        </div>
      </div>
      <div className="p-card-bottom">
        <div className="p-card-swatches" aria-label="Available colors">
          {p.colors.slice(0, 5).map((color, i) => <i key={`${color}-${i}`} style={{ background: color }} title={`Color ${i + 1}`} />)}
        </div>
        <button className="p-card-arrow" onClick={() => go(`/product/${p.slug}`)} aria-label={`Open ${p.name}`}><ArrowUpRight size={17} /></button>
      </div>
    </article>
  )
}
