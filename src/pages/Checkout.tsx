import { useState } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, LockKeyhole, Tag, Truck } from 'lucide-react'
import { money, productVariant, products, SHIPPING_FEE, validateDiscount } from '../lib'
import type { CartLine, CheckoutDetails } from '../lib'

type Props = {
  cart: CartLine[]
  subtotal: number
  quantityDiscount: number
  finish: (details: CheckoutDetails, discountCode: string) => Promise<void>
  go: (path: string) => void
  catalogLoaded: boolean
}

export default function Checkout({ cart, subtotal, quantityDiscount, finish, go, catalogLoaded }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountBusy, setDiscountBusy] = useState(false)
  const [discountMessage, setDiscountMessage] = useState('')

  const missing = cart.filter((line) => !products.some((product) => product.id === line.productId))
  if (missing.length && !catalogLoaded) return <main className="checkout-page section-pad"><div className="empty-state"><h2>Loading your pieces…</h2></div></main>
  if (missing.length) return <main className="checkout-page section-pad"><div className="empty-state"><span className="empty-icon"><CircleAlert size={25} /></span><h2>Some pieces are no longer available.</h2><p>Return to your bag and remove them first.</p><button className="solid-btn" onClick={() => go('/cart')}>REVIEW YOUR BAG</button></div></main>
  if (!cart.length) return <main className="checkout-page section-pad"><div className="empty-state"><h2>Your bag is empty.</h2><button className="solid-btn" onClick={() => go('/shop')}>SHOP THE COLLECTION</button></div></main>

  const applyDiscount = async () => {
    const code = discountInput.trim().toUpperCase()
    if (!code) { setDiscountMessage('Enter a discount code first.'); setDiscountCode(''); setDiscountPercent(0); return }
    setDiscountBusy(true); setDiscountMessage('')
    try {
      const result = await validateDiscount(code)
      setDiscountCode(result.code); setDiscountPercent(result.amount)
      setDiscountMessage(`${result.code} applied — ${result.amount}% off.`)
    } catch (err) {
      setDiscountCode(''); setDiscountPercent(0)
      setDiscountMessage(err instanceof Error ? err.message : 'Could not check this code.')
    } finally { setDiscountBusy(false) }
  }

  const couponBase = Math.max(0, subtotal - quantityDiscount)
  const discountAmount = Math.round(couponBase * discountPercent) / 100
  const total = Math.max(0, couponBase - discountAmount) + SHIPPING_FEE

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const values = new FormData(form)
    if (String(values.get('website') || '').trim()) return
    const details: CheckoutDetails = {
      name: `${values.get('firstName')} ${values.get('lastName')}`.trim(),
      email: String(values.get('email') || '').trim(),
      phone: String(values.get('phone') || '').trim(),
      address: String(values.get('address') || '').trim(),
      city: String(values.get('city') || '').trim(),
      postalCode: String(values.get('postalCode') || '').trim(),
      deliveryNotes: String(values.get('deliveryNotes') || '').trim(),
    }
    setBusy(true); setError('')
    try { await finish(details, discountCode) }
    catch (err) { setError(err instanceof Error ? err.message : 'Order submission failed. Please try again.') }
    finally { setBusy(false) }
  }

  return (
    <main className="checkout-page section-pad">
      <div className="breadcrumb"><button onClick={() => go('/')}>HOME</button><span>/</span><button onClick={() => go('/cart')}>BAG</button><span>/</span><span>CHECKOUT</span></div>
      <div className="page-title-row" data-reveal><div><span className="section-tag">ALMOST YOURS</span><h1>CHECKOUT.</h1></div><p>We'll contact you to confirm delivery and payment.</p></div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <fieldset data-reveal><legend><span>01</span> CONTACT</legend>
            <div className="form-grid two">
              <label>EMAIL<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
              <label>PHONE<input name="phone" type="tel" required autoComplete="tel" placeholder="+216" /></label>
            </div>
          </fieldset>
          <fieldset data-reveal><legend><span>02</span> DELIVERY ADDRESS</legend>
            <div className="form-grid two">
              <label>FIRST NAME<input name="firstName" required autoComplete="given-name" /></label>
              <label>LAST NAME<input name="lastName" required autoComplete="family-name" /></label>
            </div>
            <label>STREET ADDRESS<input name="address" required autoComplete="street-address" /></label>
            <div className="form-grid two">
              <label>CITY<input name="city" required autoComplete="address-level2" /></label>
              <label>POSTAL CODE<input name="postalCode" required autoComplete="postal-code" /></label>
            </div>
            <label>DELIVERY NOTES <span className="optional">OPTIONAL</span><textarea name="deliveryNotes" rows={3} maxLength={500} placeholder="Apartment, floor, directions…" /></label>
          </fieldset>
          <fieldset data-reveal><legend><span>03</span> PAYMENT</legend>
            <div className="payment-card"><span className="payment-icon"><Truck size={20} /></span><div><b>PAY ON DELIVERY</b><small>Pay in cash when your order arrives. No card details needed.</small></div><LockKeyhole size={17} /></div>
          </fieldset>
          {error && <p className="inline-error" role="alert"><CircleAlert size={15} /> {error}</p>}
          <button className="solid-btn full place-order" type="submit" disabled={busy}>{busy ? 'PLACING YOUR ORDER…' : `PLACE ORDER · ${money(total)}`} <ArrowRight size={17} /></button>
          <button className="text-btn" type="button" onClick={() => go('/cart')}><ArrowLeft size={15} /> BACK TO BAG</button>
        </form>

        <aside className="checkout-summary" data-reveal>
          <span className="section-tag">IN YOUR BAG</span>
          <h2>The breakdown.</h2>
          <div className="checkout-items">
            {cart.map((line) => {
              const p = products.find((item) => item.id === line.productId)
              if (!p) return null
              const variant = productVariant(p, line.color)
              return <div className="checkout-item" key={line.key}>
                <img src={variant?.images[0] || p.image} alt="" />
                <div><b>{p.name}</b><small>{line.size} · {variant?.name || line.color} · ×{line.qty}</small></div>
                <strong>{money(p.price * line.qty)}</strong>
              </div>
            })}
          </div>
          <div className="discount-box">
            <label><Tag size={15} /> HAVE A CODE?</label>
            <div><input value={discountInput} onChange={(e) => setDiscountInput(e.target.value.toUpperCase())} placeholder="ENTER CODE" disabled={discountBusy} /><button onClick={applyDiscount} disabled={discountBusy}>{discountBusy ? '…' : 'APPLY'}</button></div>
            {discountMessage && <small className={discountPercent > 0 ? 'is-success' : 'is-error'}>{discountMessage}</small>}
          </div>
          <div className="summary-row"><span>Subtotal</span><b>{money(subtotal)}</b></div>
          {quantityDiscount > 0 && <div className="summary-row is-saving"><span>Multi-buy savings</span><b>−{money(quantityDiscount)}</b></div>}
          {discountAmount > 0 && <div className="summary-row is-saving"><span>{discountCode} ({discountPercent}%)</span><b>−{money(discountAmount)}</b></div>}
          <div className="summary-row"><span>Delivery</span><b>{money(SHIPPING_FEE)}</b></div>
          <div className="summary-total"><span>TOTAL</span><strong>{money(total)}</strong></div>
          <p className="summary-note">Stock is reserved when your order is placed.</p>
        </aside>
      </div>
    </main>
  )
}
