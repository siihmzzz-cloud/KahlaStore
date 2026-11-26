import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleAlert, ShoppingBag, Truck, X } from 'lucide-react'
import { activeDiscountPercent, categoryOf, money, multiBuyRate, productImages, productVariant, productVariants } from '../lib'
import type { Product as ProductType } from '../lib'

type Pick = { color: string; size: string }
type Props = {
  product: ProductType
  go: (path: string) => void
  addCartPicks: (product: ProductType, picks: Pick[]) => boolean
}

export default function Product({ product: p, go, addCartPicks }: Props) {
  const variants = productVariants(p)
  const discount = activeDiscountPercent(p)
  const initialColor = variants[0]?.color || ''
  const [variantId, setVariantId] = useState(variants[0]?.id || '')
  const [count, setCount] = useState(1)
  const [picks, setPicks] = useState<Pick[]>([{ color: initialColor, size: '' }])
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [guideIndex, setGuideIndex] = useState<number | null>(null)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [recommendation, setRecommendation] = useState('')

  useEffect(() => {
    setVariantId(variants[0]?.id || ''); setCount(1)
    setPicks([{ color: variants[0]?.color || '', size: '' }])
    setActiveImage(0); setError(''); setAdded(false); setGuideIndex(null)
  }, [p.id])

  const variant = variants.find((item) => item.id === variantId) || variants[0]
  const images = variant?.images.length ? variant.images : productImages(p)
  const currentImage = images[Math.min(activeImage, Math.max(0, images.length - 1))]
  const selectedPicks = picks.slice(0, count)
  const soldOut = p.stock === 0
  const maxPack = Math.min(4, p.stock ?? 4)

  const setPackCount = (next: number) => {
    const safe = Math.max(1, Math.min(maxPack, next))
    setCount(safe)
    setPicks((current) => Array.from({ length: safe }, (_, index) => current[index] || { color: variant?.color || '', size: '' }))
    setError(''); setAdded(false)
  }
  const pickColor = (index: number, color: string) => {
    const nextVariant = variants.find((item) => item.color === color) || variants[0]
    setPicks((current) => current.map((pick, pickIndex) => pickIndex === index ? { color, size: nextVariant?.sizes.includes(pick.size) ? pick.size : '' } : pick))
    setVariantId(nextVariant?.id || ''); setActiveImage(0); setError(''); setAdded(false)
  }
  const suggestSize = () => {
    const h = Number(height), w = Number(weight)
    if (!h || !w || h < 80 || h > 230 || w < 15 || w > 250) { setRecommendation('أدخل طولاً صحيحاً (80–230 سم) ووزناً صحيحاً (15–250 كغ).'); return }
    const available = (guideIndex === null ? variant : productVariant(p, picks[guideIndex]?.color))?.sizes || p.sizes
    if (available.some((size) => /Y$/i.test(size))) {
      const kids = ['2Y', '4Y', '6Y', '8Y']
      const target = h < 105 ? 0 : h < 120 ? 1 : h < 135 ? 2 : 3
      const best = kids[target]
      setRecommendation(available.includes(best) ? `المقاس المقترح: ${best}` : `أقرب مقاس متاح: ${available[Math.min(target, available.length - 1)] || available[0]}`)
      return
    }
    const scale = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const score = (w - 42) / 11 + (h - 165) / 27
    const idx = Math.max(0, Math.min(scale.length - 1, Math.round(score) + 1))
    const best = available.reduce((closest, size) => Math.abs(scale.indexOf(size) - idx) < Math.abs(scale.indexOf(closest) - idx) ? size : closest, available[0] || 'M')
    setRecommendation(`المقاس المقترح: ${best}`)
  }
  const applyRecommendation = () => {
    const size = recommendation.match(/(?:المقاس المقترح|أقرب مقاس متاح): ([^ ]+)/)?.[1]
    if (size && guideIndex !== null) {
      setPicks((current) => current.map((pick, index) => index === guideIndex ? { ...pick, size } : pick))
      setGuideIndex(null); setRecommendation(''); setError('')
    }
  }
  const amountOff = Math.round(p.price * count * multiBuyRate(count)) / 100
  const invalidRecommendation = recommendation.startsWith('أدخل')
  const submit = (checkout: boolean) => {
    if (soldOut) return
    if (selectedPicks.some((pick) => !pick.color || !pick.size)) { setError('Choose a color and an available size for every piece.'); return }
    if (addCartPicks(p, selectedPicks)) { setError(''); setAdded(true); if (checkout) go('/checkout') }
  }

  return (
    <main className="product-page">
      <div className="product-page-head section-pad">
        <div className="breadcrumb"><button onClick={() => go('/')}>HOME</button><span>/</span><button onClick={() => go('/shop')}>SHOP</button><span>/</span><span>{p.name.toUpperCase()}</span></div>
        <span className="section-tag">{categoryOf(p)} / {p.type.toUpperCase()}</span>
      </div>

      <div className="detail-grid section-pad">
        <div className="detail-gallery">
          <div className="detail-feature">
            <img src={currentImage} alt={`${p.name} in ${variant?.name || 'selected color'}`} fetchPriority="high" />
            <div className="detail-badges">
              {soldOut && <span className="tag tag-dark">SOLD OUT</span>}
              {discount > 0 && <span className="tag tag-acid">−{discount}%</span>}
              {p.newest && !soldOut && <span className="tag tag-light">NEW IN</span>}
            </div>
            <span className="detail-image-count">{String(Math.min(activeImage + 1, images.length)).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
          </div>
          {images.length > 1 && <div className="detail-thumbs" aria-label="Product photos">
            {images.map((image, index) => <button key={`${image}-${index}`} className={activeImage === index ? 'is-active' : ''} aria-label={`View photo ${index + 1}`} aria-pressed={activeImage === index} onClick={() => setActiveImage(index)}><img src={image} alt="" loading="lazy" /></button>)}
          </div>}
        </div>

        <div className="detail-panel">
          <div className="detail-title-row">
            <div><h1>{p.name}</h1><p className="detail-type">{p.type} · {p.category}</p></div>
          </div>
          <div className="detail-price">
            <strong>{money(p.price)}</strong>
            {discount > 0 && <><s>{money(p.compareAtPrice || p.price)}</s><span className="tag tag-acid">−{discount}%</span></>}
          </div>
          <p className="detail-desc">{p.description || 'An easy piece for the everyday. Designed for comfort, movement, and making it your own.'}</p>
          <div className="detail-delivery"><Truck size={17} /><span>Delivery across Tunisia · <b>8 DT</b></span><i /> <span>Pay on delivery</span></div>

          <div className="pack-block">
            <div className="block-head"><b>BUILD YOUR PACK</b><span>More pieces, less per piece</span></div>
            <div className="pack-options">
              {[1, 2, 3, 4].filter((qty) => qty <= maxPack).map((qty) => (
                <button key={qty} className={`pack-option${count === qty ? ' is-active' : ''}`} aria-pressed={count === qty} onClick={() => setPackCount(qty)} disabled={soldOut}>
                  <span className="pack-dot" /><b>{qty} {qty === 1 ? 'piece' : 'pieces'}</b>
                  <small>{qty === 1 ? 'Regular' : `${multiBuyRate(qty)}% off`}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="pick-list">
            {selectedPicks.map((pick, index) => {
              const itemVariant = productVariant(p, pick.color)
              const availableSizes = itemVariant?.sizes || []
              return <article className="pick-card" key={index}>
                <div className="pick-head"><span className="pick-num">{String(index + 1).padStart(2, '0')}</span><b>PIECE {index + 1}</b><small>{itemVariant?.name || 'Choose a color'}</small>
                  {index > 0 && <button onClick={() => setPackCount(count - 1)} aria-label={`Remove piece ${index + 1}`}><X size={16} /></button>}
                </div>
                <div className="pick-group"><span className="pick-label">COLOR</span>
                  <div className="detail-swatches">{variants.map((item) => <button key={item.id} style={{ background: item.color }} className={pick.color === item.color ? 'is-active' : ''} aria-label={`Piece ${index + 1}: ${item.name}`} title={item.name} onClick={() => pickColor(index, item.color)} />)}</div>
                </div>
                <div className="pick-group"><div className="pick-label-row"><span className="pick-label">SIZE</span><button className="size-guide-trigger" onClick={() => { setGuideIndex(index); setHeight(''); setWeight(''); setRecommendation('') }}>دليل المقاسات <ArrowUpRight size={12} /></button></div>
                  <div className="size-buttons">{availableSizes.map((size) => <button key={size} className={pick.size === size ? 'is-active' : ''} onClick={() => { setPicks((current) => current.map((item, pickIndex) => pickIndex === index ? { ...item, size } : item)); setError('') }}>{size}</button>)}</div>
                </div>
              </article>
            })}
          </div>

          <div className="detail-summary"><span>{count} {count === 1 ? 'piece' : 'pieces'} subtotal</span><strong>{money(p.price * count - amountOff)}</strong>{amountOff > 0 && <small>You save {money(amountOff)}</small>}</div>
          <div className="detail-actions">
            <button className="solid-btn" onClick={() => submit(false)} disabled={soldOut}>{soldOut ? 'SOLD OUT' : added ? 'ADDED TO BAG' : 'ADD TO BAG'} <ShoppingBag size={16} /></button>
            <button className="outline-btn" onClick={() => submit(true)} disabled={soldOut}>BUY NOW <ArrowRight size={16} /></button>
          </div>
          {error && <p className="inline-error" role="status"><CircleAlert size={14} /> {error}</p>}
          <p className="stock-note">{p.stock === undefined ? 'Available online · We confirm stock before dispatch.' : p.stock > 0 ? `${p.stock} currently available` : 'Currently unavailable'}</p>

          <div className="accordions">
            <details><summary>PRODUCT DETAILS <ChevronDown size={16} /></summary><p>{p.description || `${p.type} in ${p.category}. Available in ${variants.map((item) => item.name).join(', ')} with sizes ${[...new Set(variants.flatMap((item) => item.sizes))].join(', ')}.`}</p></details>
            <details><summary>DELIVERY &amp; RETURNS <ChevronDown size={16} /></summary><p>Delivery is a flat 8 DT across Tunisia and payment is on delivery. Unworn pieces can be returned within 14 days — contact support to start a return.</p></details>
          </div>
          <button className="text-btn back-link" onClick={() => go('/shop')}><ArrowLeft size={15} /> BACK TO SHOP</button>
        </div>
      </div>

      <div className="mobile-buy-bar">
        <span><small>{count} {count === 1 ? 'PIECE' : 'PIECES'}</small><strong>{money(p.price * count - amountOff)}</strong></span>
        <button className="solid-btn" onClick={() => submit(true)} disabled={soldOut}>BUY NOW <ArrowRight size={15} /></button>
      </div>

      {guideIndex !== null && (
        <div className="guide-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setGuideIndex(null) }}>
          <section className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title" dir="rtl" lang="ar">
            <button className="guide-close" onClick={() => setGuideIndex(null)} aria-label="إغلاق دليل المقاسات"><X size={18} /></button>
            <span className="section-tag">فحص سريع للمقاس · القطعة {guideIndex + 1}</span>
            <h2 id="guide-title">اعثر على مقاسك.</h2>
            <p>أدخل الطول والوزن للحصول على تقدير بسيط. قد يختلف المقاس حسب التصميم.</p>
            <div className="guide-fields">
              <label>الطول <span>سم</span><input type="number" min="80" max="230" placeholder="مثال 175" value={height} onChange={(e) => setHeight(e.target.value)} /></label>
              <label>الوزن <span>كغ</span><input type="number" min="15" max="250" placeholder="مثال 70" value={weight} onChange={(e) => setWeight(e.target.value)} /></label>
            </div>
            <button className="solid-btn full" onClick={suggestSize}>اقترح مقاساً <ArrowLeft size={15} /></button>
            {recommendation && <div className={`guide-result${invalidRecommendation ? ' is-invalid' : ''}`} role="status"><Check size={17} /><span>{recommendation}<small>تقدير عام، وليس قياساً فعلياً للقطعة.</small></span>{!invalidRecommendation && <button onClick={applyRecommendation}>استخدام المقاس</button>}</div>}
            <div className="size-chart"><h3>جدول المقاسات <span>سم</span></h3><div className="size-chart-scroll"><table><thead><tr><th>المقاس</th><th>العرض</th><th>الطول</th></tr></thead><tbody>{[['S', '57', '64'], ['M', '60', '66'], ['L', '62', '68'], ['XL', '64', '70']].map((row) => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div><p>قد تختلف القياسات قليلاً حسب التصميم.</p></div>
          </section>
        </div>
      )}
    </main>
  )
}
