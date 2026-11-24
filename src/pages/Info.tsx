import { useState } from 'react'
import { ArrowRight, Check, CircleAlert, Mail, MapPin, Send, Truck } from 'lucide-react'
import { createSupportTicket, getSettings, money, persist, supportErrorMessage } from '../lib'
import type { OrderResult } from '../lib'

type Go = (path: string) => void

export function Confirmation({ order, go }: { order: OrderResult | null; go: Go }) {
  const settings = getSettings()
  if (!order) return (
    <main className="confirmation-page section-pad">
      <div className="empty-state" data-reveal>
        <span className="empty-icon"><CircleAlert size={26} /></span>
        <h2>No recent order on this device.</h2>
        <p>Once you place an order, your confirmation and reference will appear here.</p>
        <div className="empty-actions"><button className="solid-btn" onClick={() => go('/shop')}>SHOP THE COLLECTION</button><button className="outline-btn" onClick={() => go('/contact')}>CONTACT SUPPORT</button></div>
      </div>
    </main>
  )
  return (
    <main className="confirmation-page section-pad">
      <div className="confirmation-card" data-reveal>
        <span className="confirmation-mark"><Check size={30} /></span>
        <span className="section-tag">ORDER CONFIRMED</span>
        <h1>THANK YOU.</h1>
        <p>Your order is in. We've saved the details and will contact you to arrange delivery.</p>
        <div className="confirmation-ref"><span>YOUR REFERENCE</span><strong>{order.order.id}</strong></div>
        <div className="confirmation-meta">
          <div><span>TOTAL</span><b>{money(Number(order.order.total))}</b></div>
          <div><span>PAYMENT</span><b>On delivery</b></div>
          <div><span>DISPATCH</span><b>Within 48 hours</b></div>
        </div>
        <p className="confirmation-note">Keep this reference for your records. Questions? Our support team is right here.</p>
        <div className="confirmation-actions"><button className="solid-btn" onClick={() => go('/shop')}>KEEP EXPLORING <ArrowRight size={16} /></button><button className="outline-btn" onClick={() => go('/contact')}>CONTACT SUPPORT</button></div>
        {settings.supportEmail && <a className="confirmation-email" href={`mailto:${settings.supportEmail}`}><Mail size={15} /> {settings.supportEmail}</a>}
      </div>
    </main>
  )
}

const copy: Record<string, { tag: string; title: string; intro: string; blocks: { h: string; p: string }[] }> = {
  shipping: {
    tag: 'DELIVERY', title: 'Shipping, simply.',
    intro: 'We deliver across Tunisia. No complicated tiers, no surprises at checkout.',
    blocks: [
      { h: 'Flat-rate delivery', p: 'Delivery is 8 DT on every order, anywhere in Tunisia. The fee is added at checkout and confirmed with your order.' },
      { h: 'Timeline', p: 'Orders are prepared within 48 hours. You will receive a call or message to confirm the delivery window before dispatch.' },
      { h: 'Payment', p: 'Pay in cash when your order arrives. We do not collect card details online.' },
    ],
  },
  returns: {
    tag: 'RETURNS', title: 'Changed your mind?',
    intro: 'Unworn pieces can be returned within 14 days of delivery.',
    blocks: [
      { h: 'How to return', p: 'Contact our support team with your order reference and the piece you would like to return. We will confirm the next steps and the return address.' },
      { h: 'Condition', p: 'Pieces must be unworn, unwashed, and in their original condition. Remember to include the original packaging where possible.' },
      { h: 'Refunds', p: 'Once we receive and check your return, we arrange the refund with you directly. Delivery fees are non-refundable.' },
    ],
  },
  privacy: {
    tag: 'PRIVACY', title: 'Your data.',
    intro: 'We collect only what we need to take your order and answer your questions.',
    blocks: [
      { h: 'What we store', p: 'Order details (name, contact, delivery address and chosen pieces) are saved so we can fulfil your order. Support conversations are saved so our team can reply.' },
      { h: 'What we do not store', p: 'We do not collect card details or payment information. Payments are made in cash on delivery.' },
      { h: 'Your browser', p: 'Your bag and support conversation reference are kept in your browser storage so your experience persists between visits.' },
      { h: 'Contact', p: 'For questions about your data, reach us through the support panel or email the store directly.' },
    ],
  },
  terms: {
    tag: 'TERMS', title: 'The small print.',
    intro: 'A few straightforward terms for shopping with KA7LA.',
    blocks: [
      { h: 'Orders', p: 'Placing an order creates a record of your chosen pieces and delivery details. Our team confirms availability and delivery before dispatch.' },
      { h: 'Pricing', p: 'Prices are shown in TND and include the item price only. Delivery is charged separately at a flat 8 DT.' },
      { h: 'Availability', p: 'Stock is updated when orders are placed. If a piece becomes unavailable, we will contact you to arrange an alternative or a refund.' },
      { h: 'Support', p: 'Questions about an order, a return, or a product are handled through the support panel or by email.' },
    ],
  },
  about: {
    tag: 'OUR STORY', title: 'Never basic.',
    intro: 'KA7LA is a Tunisian streetwear label built around pieces you actually wear.',
    blocks: [
      { h: 'The idea', p: 'We started with a simple question: what would an everyday wardrobe look like if nothing in it felt like a compromise? The answer is considered fabrics, relaxed shapes and details that hold up.' },
      { h: 'Made here', p: 'Our collections are designed and produced in Tunisia. Keeping production close means we can move quickly and stay connected to every piece we make.' },
      { h: 'Made for you', p: 'No dress code, no rules. Just clothes that make the everyday feel a little more like your own.' },
    ],
  },
}

export function InfoPage({ slug, go }: { slug: string; go: Go }) {
  const settings = getSettings()
  if (slug === 'contact') return <ContactPage go={go} />
  const content = copy[slug] || copy.about
  return (
    <main className="info-page">
      <section className="info-hero">
        <div className="section-pad">
          <div className="breadcrumb"><button onClick={() => go('/')}>HOME</button><span>/</span><span>{content.tag}</span></div>
          <span className="section-tag">{content.tag}</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
      </section>
      <section className="info-body section-pad">
        <div className="info-blocks">
          {content.blocks.map((block, index) => <article key={block.h} data-reveal><span className="info-index">{String(index + 1).padStart(2, '0')}</span><div><h2>{block.h}</h2><p>{block.p}</p></div></article>)}
        </div>
        <aside className="info-aside" data-reveal>
          <span className="section-tag">NEED MORE?</span>
          <h3>We're here to help.</h3>
          <p>Questions about an order, sizing, or a return? Send us a message and we'll get back to you.</p>
          <button className="solid-btn full" onClick={() => go('/contact')}>CONTACT US <ArrowRight size={16} /></button>
          {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}><Mail size={15} /> {settings.supportEmail}</a>}
        </aside>
      </section>
      <section className="info-cta">
        <div className="section-pad" data-reveal><span className="section-tag">READY WHEN YOU ARE</span><h2>GOOD CLOTHES. NO DELAY.</h2><button className="solid-btn" onClick={() => go('/shop')}>SHOP THE COLLECTION <ArrowRight size={16} /></button></div>
      </section>
    </main>
  )
}

function ContactPage({ go }: { go: Go }) {
  const settings = getSettings()
  const [draft, setDraft] = useState({ name: '', contact: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const session = await createSupportTicket(draft)
      persist('ka7la-support-session', session)
      setSent(true); setDraft({ name: '', contact: '', subject: '', message: '' })
    } catch (reason) { setError(supportErrorMessage(reason)) } finally { setBusy(false) }
  }

  return (
    <main className="info-page">
      <section className="info-hero">
        <div className="section-pad">
          <div className="breadcrumb"><button onClick={() => go('/')}>HOME</button><span>/</span><span>CONTACT</span></div>
          <span className="section-tag">GET IN TOUCH</span>
          <h1>Let's talk.</h1>
          <p>Questions, sizing help, order updates — send a message and our team will reply here.</p>
        </div>
      </section>
      <section className="contact-body section-pad">
        <div className="contact-form-wrap" data-reveal>
          {sent ? <div className="contact-sent"><span className="confirmation-mark"><Check size={26} /></span><h2>Message received.</h2><p>Your conversation is saved on this device. Our team will reply through the support panel.</p><button className="solid-btn" onClick={() => setSent(false)}>SEND ANOTHER MESSAGE</button></div> : (
            <form className="contact-form" onSubmit={submit}>
              <div className="form-grid two"><label>YOUR NAME<input required maxLength={100} autoComplete="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>EMAIL OR PHONE<input required maxLength={160} value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} /></label></div>
              <label>SUBJECT<input required maxLength={140} placeholder="What's on your mind?" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>
              <label>MESSAGE<textarea required maxLength={3000} rows={6} placeholder="Tell us a little more…" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} /></label>
              {error && <p className="inline-error" role="alert"><CircleAlert size={15} /> {error}</p>}
              <button className="solid-btn" type="submit" disabled={busy}><Send size={16} /> {busy ? 'SENDING…' : 'SEND MESSAGE'}</button>
            </form>
          )}
        </div>
        <aside className="contact-aside" data-reveal>
          <div className="contact-detail"><span><Mail size={18} /></span><div><b>EMAIL</b>{settings.supportEmail ? <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a> : <p>Use the form and we'll reply here.</p>}</div></div>
          <div className="contact-detail"><span><Truck size={18} /></span><div><b>DELIVERY</b><p>{settings.shippingNote}</p></div></div>
          <div className="contact-detail"><span><MapPin size={18} /></span><div><b>BASED IN</b><p>Tunisia — delivering everywhere in the country.</p></div></div>
          <div className="contact-hours"><span className="live-dot" /> MESSAGES ANSWERED AS SOON AS POSSIBLE</div>
        </aside>
      </section>
    </main>
  )
}
