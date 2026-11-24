import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck, CircleAlert } from 'lucide-react'
import { lineMultiBuySavings, money, multiBuyRate, productVariant, products } from '../lib'
import type { CartLine } from '../lib'

type Props = {
  cart: CartLine[]
  updateCart: (key: string, qty: number) => void
  go: (path: string) => void
  subtotal: number
  quantityDiscount: number
  catalogLoaded: boolean
}

export default function Cart({ cart, updateCart, go, subtotal, quantityDiscount, catalogLoaded }: Props) {
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0)
  const missing = cart.filter((line) => !products.some((product) => product.id === line.productId))

  if (missing.length && !catalogLoaded) return <main className="cart-page section-pad"><div className="empty-state"><span className="empty-icon"><ShoppingBag size={25} /></span><h2>Loading your pieces…</h2></div></main>
  if (missing.length) return <main className="cart-page section-pad"><div className="empty-state"><span className="empty-icon"><CircleAlert size={25} /></span><h2>Some pieces are no longer available.</h2><p>Remove them to continue to checkout.</p><button className="solid-btn" onClick={() => missing.forEach((line) => updateCart(line.key, 0))}>REMOVE UNAVAILABLE PIECES</button></div></main>

  return (
    <main className="cart-page section-pad">
      <div className="breadcrumb"><button onClick={() => go('/')}>HOME</button><span>/</span><span>YOUR BAG</span></div>
      <div className="page-title-row" data-reveal><div><span className="section-tag">THE GOOD STUFF</span><h1>YOUR BAG <em>({itemCount})</em></h1></div>{itemCount > 0 && <p>Review your pieces and sizes before checkout.</p>}</div>

      {!cart.length ? (
        <div className="empty-state" data-reveal>
          <span className="empty-icon"><ShoppingBag size={28} /></span>
          <h2>Your bag is taking a breather.</h2>
          <p>Find something you'll reach for every day.</p>
          <button className="solid-btn" onClick={() => go('/shop')}>EXPLORE THE SHOP <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((line) => {
              const p = products.find((item) => item.id === line.productId)!
              const variant = productVariant(p, line.color)
              const saving = lineMultiBuySavings(cart, line, p.price)
              const rate = multiBuyRate(cart.filter((item) => item.productId === line.productId).reduce((sum, item) => sum + item.qty, 0))
              return <article className="cart-line" key={line.key} data-reveal>
                <button className="cart-line-img" onClick={() => go(`/product/${p.slug}`)} aria-label={`View ${p.name}`}><img src={variant?.images[0] || p.image} alt={p.name} /></button>
                <div className="cart-line-info">
                  <button className="cart-line-name" onClick={() => go(`/product/${p.slug}`)}>{p.name}</button>
                  <span>{p.type} · Size {line.size} · {variant?.name || line.color}</span>
                  {rate > 0 && <b className="cart-line-deal">{rate}% multi-buy saving applied</b>}
                  <div className="cart-line-controls">
                    <div className="qty-control"><button onClick={() => updateCart(line.key, line.qty - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span>{line.qty}</span><button onClick={() => updateCart(line.key, line.qty + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div>
                    <button className="remove-btn" onClick={() => updateCart(line.key, 0)}><Trash2 size={14} /> REMOVE</button>
                  </div>
                </div>
                <div className="cart-line-price"><strong>{money(p.price * line.qty - saving)}</strong>{saving > 0 && <small>−{money(saving)} offer</small>}</div>
              </article>
            })}
            <button className="text-btn cart-back" onClick={() => go('/shop')}><ArrowLeft size={15} /> CONTINUE SHOPPING</button>
          </div>
          <aside className="cart-summary" data-reveal>
            <span className="section-tag">ORDER SUMMARY</span>
            <h2>The details.</h2>
            <div className="summary-row"><span>Subtotal ({itemCount} {itemCount === 1 ? 'piece' : 'pieces'})</span><b>{money(subtotal)}</b></div>
            {quantityDiscount > 0 && <div className="summary-row is-saving"><span>Multi-buy savings</span><b>−{money(quantityDiscount)}</b></div>}
            <div className="summary-row"><span>Delivery</span><b>8 DT</b></div>
            <div className="summary-total"><span>TOTAL</span><strong>{money(Math.max(0, subtotal - quantityDiscount) + 8)}</strong></div>
            <p className="summary-note"><Truck size={15} /> Pay on delivery. No card required.</p>
            <button className="solid-btn full" onClick={() => go('/checkout')}>CONTINUE TO CHECKOUT <ArrowRight size={16} /></button>
            <button className="quiet-btn full" onClick={() => go('/shop')}>KEEP EXPLORING</button>
          </aside>
        </div>
      )}
    </main>
  )
}
