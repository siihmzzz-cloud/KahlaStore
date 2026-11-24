import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight, Check, CircleAlert, Headset, Send, X } from 'lucide-react'
import { gsap } from 'gsap'
import { createSupportTicket, getSupportConversation, getSettings, persist, sendSupportMessage, supportErrorMessage } from '../lib'
import type { SupportMessage, SupportSession } from '../lib'

/* ------------------------------- Marquee ------------------------------ */

export function Marquee({ children, className = '', duration = 28, reverse = false }: { children: ReactNode; className?: string; duration?: number; reverse?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const unit = useRef<HTMLDivElement>(null)
  const [loop, setLoop] = useState({ repeat: 2, startX: 0, endX: 0 })

  /* Repeat the message until one half is wider than the screen, then start
     the loop with a copy centred in the viewport instead of flush left. */
  useEffect(() => {
    const container = root.current
    const sample = unit.current
    if (!container || !sample) return
    const measure = () => {
      const unitWidth = sample.getBoundingClientRect().width
      const viewWidth = container.clientWidth
      if (!unitWidth || !viewWidth) return
      const repeat = Math.max(2, Math.ceil(viewWidth / unitWidth) + 1)
      const middle = Math.floor(repeat / 2)
      const startX = -(middle * unitWidth + unitWidth / 2 - viewWidth / 2)
      setLoop((current) => (
        current.repeat === repeat && current.startX === startX
          ? current
          : { repeat, startX, endX: startX - repeat * unitWidth }
      ))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [children])

  useEffect(() => {
    if (!loop.endX && !loop.startX) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!track.current) return
      const tween = gsap.fromTo(track.current,
        { x: reverse ? loop.endX : loop.startX },
        { x: reverse ? loop.startX : loop.endX, duration, ease: 'none', repeat: -1 },
      )
      return () => tween.kill()
    })
    return () => mm.revert()
  }, [duration, reverse, loop])

  const half = (hidden: boolean) => (
    <div className="marquee-half" aria-hidden={hidden || undefined}>
      {Array.from({ length: loop.repeat }, (_, index) => (
        <div className="marquee-copy" key={index} ref={!hidden && index === 0 ? unit : undefined}>{children}</div>
      ))}
    </div>
  )

  return (
    <div className={`marquee ${className}`} ref={root} aria-label={typeof children === 'string' ? children : undefined}>
      <div className="marquee-track" ref={track}>
        {half(false)}
        {half(true)}
      </div>
    </div>
  )
}

/* --------------------------- Support widget ---------------------------- */

const emptyDraft = { name: '', contact: '', subject: '', message: '' }

export function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<SupportSession | null>(() => {
    try { return JSON.parse(localStorage.getItem('ka7la-support-session') || 'null') } catch { return null }
  })
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [ticketInfo, setTicketInfo] = useState<{ subject: string; status: string } | null>(null)

  useEffect(() => {
    if (!session || !open) return
    let active = true
    const refresh = async () => {
      try {
        const data = await getSupportConversation(session)
        if (active) { setTicketInfo({ subject: data.ticket.subject, status: data.ticket.status }); setMessages(data.messages || []) }
      } catch (reason) { if (active) setError(supportErrorMessage(reason)) }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => { active = false; window.clearInterval(timer) }
  }, [session, open])

  const submitTicket = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const next = await createSupportTicket(draft)
      persist('ka7la-support-session', next)
      setSession(next)
      setDraft(emptyDraft)
    } catch (reason) { setError(supportErrorMessage(reason)) } finally { setBusy(false) }
  }

  const sendReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session || busy || !reply.trim()) return
    setBusy(true); setError('')
    try {
      await sendSupportMessage(session, reply.trim())
      setReply('')
      const data = await getSupportConversation(session)
      setTicketInfo({ subject: data.ticket.subject, status: data.ticket.status })
      setMessages(data.messages || [])
    } catch (reason) { setError(supportErrorMessage(reason)) } finally { setBusy(false) }
  }

  const startNew = () => {
    localStorage.removeItem('ka7la-support-session')
    setSession(null); setTicketInfo(null); setMessages([]); setError('')
  }
  const email = getSettings().supportEmail

  return (
    <div className={`support-widget${open ? ' is-open' : ''}`}>
      {open && (
        <section className="support-panel" role="dialog" aria-label="KA7LA support">
          <header className="support-head">
            <span><i className="live-dot" /> STORE SUPPORT</span>
            <button onClick={() => setOpen(false)} aria-label="Close support"><X size={17} /></button>
          </header>
          {session ? (
            <>
              <div className="support-intro"><b>{ticketInfo?.subject || 'Your conversation'}</b><p>{ticketInfo?.status === 'Resolved' ? 'This request is resolved. You can still reply here.' : 'A member of the KA7LA team will reply here shortly.'}</p></div>
              <div className="support-chat" aria-live="polite">
                {messages.map((item) => (
                  <article className={`support-msg ${item.sender}`} key={item.id}>
                    <span>{item.sender === 'admin' ? 'KA7LA' : 'YOU'}</span>
                    <p>{item.message}</p>
                    <time>{new Date(item.created_at).toLocaleString()}</time>
                  </article>
                ))}
              </div>
              <form className="support-form" onSubmit={sendReply}>
                <label>MESSAGE<input maxLength={3000} required value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply…" /></label>
                {error && <p className="inline-error"><CircleAlert size={14} /> {error}</p>}
                <button className="solid-btn full" type="submit" disabled={busy}><Send size={15} /> {busy ? 'SENDING…' : 'SEND MESSAGE'}</button>
                <button className="quiet-btn" type="button" onClick={startNew}>START A NEW REQUEST</button>
              </form>
            </>
          ) : (
            <>
              <div className="support-intro"><b>How can we help?</b><p>Send a message and our team will reply right here. Your conversation stays on this device.</p></div>
              <form className="support-form" onSubmit={submitTicket}>
                <label>YOUR NAME<input required maxLength={100} autoComplete="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
                <label>EMAIL OR PHONE<input required maxLength={160} autoComplete="email" value={draft.contact} onChange={(e) => setDraft({ ...draft, contact: e.target.value })} /></label>
                <label>SUBJECT<input required maxLength={140} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></label>
                <label>MESSAGE<textarea required maxLength={3000} rows={4} value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} /></label>
                {error && <p className="inline-error"><CircleAlert size={14} /> {error}</p>}
                <button className="solid-btn full" type="submit" disabled={busy}><Send size={15} /> {busy ? 'SENDING…' : 'SEND MESSAGE'}</button>
                {email && <a className="support-email" href={`mailto:${email}`}>Or email {email} <ArrowUpRight size={13} /></a>}
              </form>
            </>
          )}
        </section>
      )}
      <button className="support-launch" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Close support' : 'Open support'}>
        {open ? <X size={19} /> : <Headset size={19} />}
        <span>{open ? 'CLOSE' : 'SUPPORT'}</span>
      </button>
    </div>
  )
}

/* ------------------------------ Toast ---------------------------------- */

export function Toast({ message, kind }: { message: string; kind: 'success' | 'error' }) {
  return <div className={`toast toast-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    {kind === 'error' ? <CircleAlert size={17} /> : <Check size={17} />}
    <span>{message}</span>
  </div>
}
