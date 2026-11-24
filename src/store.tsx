import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ArrowUpRight, Check, Menu, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ADMIN_EMAIL, getProducts, getSettings, isSupabaseConfigured, load, loadStoreData, money, multiBuySavings,
  persist, placeOrder, productVariant, saveCatalog as saveCatalogRemote,
  saveSettings as saveSettingsRemote, signInAdmin, signOutAdmin, deleteCatalogProduct, categoryOf,
} from './lib'
import type { AdminSession, CartLine, CheckoutDetails, OrderResult, Product } from './lib'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductPage from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import { Confirmation, InfoPage } from './pages/Info'
import { AdminPanel, SignIn } from './pages/Admin'
import { Marquee, SupportWidget, Toast } from './components/Shared'

gsap.registerPlugin(ScrollTrigger)

type DrawerType = 'cart' | 'menu' | null

function App() {
  const [route, setRoute] = useState(window.location.pathname + window.location.search)
  const [hasScrolled, setHasScrolled] = useState(window.scrollY > 80)
  const [cart, setCart] = useState<CartLine[]>(() => load('ka7la-cart', load('ka7ha-cart', [])))
  const [drawer, setDrawer] = useState<DrawerType>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState<{ id: number; message: string; kind: 'success' | 'error' } | null>(null)
  const [order, setOrder] = useState<OrderResult | null>(null)
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [catalogLoaded, setCatalogLoaded] = useState(!isSupabaseConfigured)
  const [version, setVersion] = useState(0)
  const pageRef = useRef<HTMLDivElement>(null)
  const curtainRef = useRef<HTMLDivElement>(null)

  const products = useMemo(() => [...getProducts()], [version])
  const settings = useMemo(() => ({ ...getSettings() }), [version])
  const bump = () => setVersion((value) => value + 1)

  useEffect(() => { persist('ka7la-cart', cart) }, [cart])
  useEffect(() => {
    localStorage.removeItem('ka7la-wish')
    localStorage.removeItem('ka7ha-wish')
  }, [])
  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    void loadStoreData(bump).catch(() => {}).finally(() => setCatalogLoaded(true))
  }, [])

  useEffect(() => {
    let alive = true
    let unsubscribe = () => {}
    const requiresAuth = ['/admin', '/signin'].includes(route.split('?')[0])
    if (!requiresAuth) { setAuthReady(false); setAdminSession(null); return () => { alive = false } }
    void import('./supabase').then(async ({ supabase }) => {
      if (!alive) return
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user
        setAdminSession(user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? { email: user.email!, role: 'admin' } : null)
      })
      unsubscribe = () => subscription.unsubscribe()
      const { data, error } = await supabase.auth.getSession()
      if (!alive) return
      if (error) console.error('Admin session restore failed:', error.message)
      const user = data.session?.user
      setAdminSession(user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? { email: user.email!, role: 'admin' } : null)
      setAuthReady(true)
    }).catch((error) => { if (alive) { console.error('Admin authentication could not initialize:', error); setAuthReady(true) } })
    return () => { alive = false; unsubscribe() }
  }, [route])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast?.id])

  useEffect(() => {
    const url = route.split('?')[0]
    document.title = url === '/' ? `${settings.brandName} — Never Basic`
      : url.startsWith('/product/') ? `${products.find((p) => p.slug === url.split('/').pop())?.name || 'Piece'} — ${settings.brandName}`
        : `${url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').toUpperCase() || 'SHOP'} — ${settings.brandName}`
  }, [route, settings.brandName, products])

  /* Page entrance + scroll reveals. Everything is scoped to the active route. */
  useEffect(() => {
    const root = pageRef.current
    if (!root) return
    const curtain = curtainRef.current
    if (curtain) {
      gsap.fromTo(curtain, { scaleY: 1, transformOrigin: 'top center' }, { scaleY: 0, duration: 0.55, ease: 'power3.inOut', transformOrigin: 'bottom center' })
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(root, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'transform' })
    }, root)
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]')
      if (targets.length) gsap.set(targets, { autoAlpha: 0, y: 26 })
      const triggers = targets.length ? ScrollTrigger.batch(targets, {
        start: 'top 90%', once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true }),
      }) : []
      const parallax = gsap.utils.toArray<HTMLElement>('[data-parallax]').map((element) => gsap.to(element, {
        yPercent: Number(element.dataset.parallax || 0.1) * 100,
        ease: 'none',
        scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: true },
      }))
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return () => { triggers.forEach((t) => t.kill()); parallax.forEach((t) => { t.scrollTrigger?.kill(); t.kill() }) }
    }, root)
    return () => { mm.revert(); ctx.revert() }
  }, [route])

  const showToast = (message: string, kind: 'success' | 'error' = 'success') => setToast({ id: Date.now(), message, kind })
  const go = (path: string) => {
    if (path === route) return
    history.pushState({}, '', path)
    setRoute(path)
    setDrawer(null); setSearchOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  const stockCheck = (p: Product, count: number) => {
    if (p.stock === 0) { showToast('This piece is currently unavailable.', 'error'); return false }
    const inCart = cart.filter((line) => line.productId === p.id).reduce((sum, line) => sum + line.qty, 0)
    if (p.stock !== undefined && inCart + count > p.stock) {
      showToast(p.stock - inCart > 0 ? `Only ${p.stock - inCart} more available.` : 'You already have every unit available.', 'error')
      return false
    }
    return true
  }
  const addCart = (p: Product, size = p.sizes[0], color = p.colors[0], count = 1) => {
    if (!stockCheck(p, count)) return false
    const key = `${p.id}-${size}-${color}`
    setCart((current) => {
      const found = current.find((line) => line.key === key)
      return found ? current.map((line) => line.key === key ? { ...line, qty: line.qty + count } : line) : [...current, { key, productId: p.id, size, color, qty: count }]
    })
    showToast(`${p.name} added to your bag`)
    return true
  }
  const addCartPicks = (p: Product, picks: { size: string; color: string }[]) => {
    if (!stockCheck(p, picks.length)) return false
    setCart((current) => picks.reduce((next, pick) => {
      const key = `${p.id}-${pick.size}-${pick.color}`
      const found = next.find((line) => line.key === key)
      return found ? next.map((line) => line.key === key ? { ...line, qty: line.qty + 1 } : line) : [...next, { key, productId: p.id, size: pick.size, color: pick.color, qty: 1 }]
    }, current))
    showToast(`${picks.length} ${p.name} ${picks.length === 1 ? 'added' : 'added'} to your bag`)
    return true
  }
  const updateCart = (key: string, qty: number) => setCart((current) => qty < 1 ? current.filter((line) => line.key !== key) : current.map((line) => line.key === key ? { ...line, qty } : line))

  const quantity = cart.reduce((sum, line) => sum + line.qty, 0)
  const subtotal = cart.reduce((sum, line) => sum + (products.find((p) => p.id === line.productId)?.price || 0) * line.qty, 0)
  const quantityDiscount = multiBuySavings(cart)
  const url = route.split('?')[0]
  const params = new URLSearchParams(route.split('?')[1] || '')
  const collection = url === '/shop' ? params.get('category') : url.startsWith('/collection/') ? decodeURIComponent(url.split('/').pop() || '') : ''
  const product = url.startsWith('/product/') ? products.find((p) => p.slug === url.split('/').pop()) : undefined
  const searchTerm = (query || params.get('q') || '').trim()
  const searchMatches = products.filter((p) => `${p.name} ${p.category} ${p.type} ${p.description || ''}`.toLowerCase().includes(searchTerm.toLowerCase()))
  const adminRoute = ['/admin', '/signin'].includes(url)
  const isHome = url === '/'

  const finishOrder = async (details: CheckoutDetails, discountCode: string) => {
    if (!cart.length) return
    const result = await placeOrder(details, discountCode, cart)
    setOrder(result)
    setCart([])
    go('/order-confirmation')
  }

  const saveCatalog = async (next: Product[]) => { await saveCatalogRemote(next, bump) }
  const saveSettings = async (next: typeof settings) => { await saveSettingsRemote(next, bump) }
  const signOut = async () => { await signOutAdmin(); setAdminSession(null); go('/signin') }

  const navLinks = [
    { label: 'SHOP', path: '/shop' },
    { label: 'T-SHIRTS', path: '/shop?category=T-SHIRTS' },
    { label: 'HOODIES', path: '/shop?category=HOODIES' },
    { label: 'ABOUT', path: '/info/about' },
  ]

  return (
    <div className={`site-shell${isHome ? ' is-home' : ''}${hasScrolled ? ' has-scrolled' : ''}${product ? ' has-mobile-buy' : ''}`}>
      <div className="route-curtain" ref={curtainRef} aria-hidden="true" />

      {!adminRoute && <header className={`site-head${hasScrolled ? ' is-scrolled' : ''}`}>
        <div className="announce">
          <Marquee duration={26}>
            <span>{settings.announcement}</span><b>✳</b><span>NEW DROP / KA7LA</span><b>✳</b>
          </Marquee>
        </div>
        <div className="nav-bar">
          <div className="nav-left">
            <button className="nav-icon mobile-only" onClick={() => setDrawer('menu')} aria-label="Open menu"><Menu size={21} /></button>
            {navLinks.map((link) => <button key={link.label} className="nav-link" onClick={() => go(link.path)}>{link.label}</button>)}
          </div>
          <button className="brand" onClick={() => go('/')} aria-label={`${settings.brandName} home`}><span>{settings.brandName}</span><sup>®</sup></button>
          <div className="nav-right">
            <button className="nav-action" onClick={() => setSearchOpen(true)} aria-label="Search"><Search size={18} /><span>SEARCH</span></button>
            <button className="nav-action nav-bag" onClick={() => setDrawer('cart')} aria-label={`Bag with ${quantity} pieces`}><ShoppingBag size={18} /><span>BAG ({quantity})</span></button>
          </div>
        </div>
      </header>}

      <div className="page-content" ref={pageRef} key={route}>
        {isHome && <Home go={go} addCart={addCart} list={products} />}
        {(url === '/shop' || url.startsWith('/collection/')) && (
          <Shop key={route} go={go}
            list={collection ? products.filter((p) => categoryOf(p) === collection.toUpperCase()) : products}
            title={collection ? collection : params.get('sort') === 'newest' ? 'New arrivals' : 'The collection'}
            eyebrow={collection ? 'SHOP BY EDIT' : 'THE KA7LA COLLECTION'}
            addCart={addCart} />
        )}
        {product && <ProductPage key={product.id} product={product} go={go} addCartPicks={addCartPicks} />}
        {url.startsWith('/product/') && !product && <main className="section-pad not-found"><span className="section-tag">404</span><h1>PIECE NOT FOUND.</h1><button className="solid-btn" onClick={() => go('/shop')}>EXPLORE THE SHOP <ArrowRight size={16} /></button></main>}
        {url === '/cart' && <Cart cart={cart} updateCart={updateCart} go={go} subtotal={subtotal} quantityDiscount={quantityDiscount} catalogLoaded={catalogLoaded} />}
        {url === '/checkout' && <Checkout cart={cart} subtotal={subtotal} quantityDiscount={quantityDiscount} finish={finishOrder} go={go} catalogLoaded={catalogLoaded} />}
        {url === '/order-confirmation' && <Confirmation order={order} go={go} />}
        {url === '/search' && <Shop key={route} go={go} list={searchMatches} title={searchTerm ? `Results for “${searchTerm}”` : 'Search results'} eyebrow="SEARCH" addCart={addCart} />}
        {(url === '/contact' || url === '/info/contact') && <InfoPage slug="contact" go={go} />}
        {url.startsWith('/info/') && url !== '/info/contact' && <InfoPage slug={url.split('/')[2]} go={go} />}
        {url === '/signin' && <SignIn onSignIn={signInAdmin} go={go} />}
        {url === '/admin' && (!authReady ? <main className="signin-page"><p className="eyebrow">CONNECTING SECURE SESSION…</p></main> : adminSession?.role === 'admin'
          ? <AdminPanel email={adminSession.email} catalog={products} saveCatalog={saveCatalog} deleteProduct={deleteCatalogProduct} settings={settings} saveSettings={saveSettings} signOut={signOut} />
          : <SignIn onSignIn={signInAdmin} go={go} />)}
        {url === '/not-found' && <main className="section-pad not-found"><span className="section-tag">404</span><h1>PAGE NOT FOUND.</h1><button className="solid-btn" onClick={() => go('/')}>BACK HOME <ArrowRight size={16} /></button></main>}
      </div>

      {!adminRoute && <Footer go={go} settings={settings} />}
      {!adminRoute && <SupportWidget />}
      {drawer && <Drawer type={drawer} close={() => setDrawer(null)} go={go} cart={cart} updateCart={updateCart} subtotal={subtotal} />}
      {searchOpen && createPortal(
        <div className="search-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
          <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search products">
            <div className="search-input-row"><Search size={20} /><input autoFocus placeholder="Search the collection…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') go(`/search?q=${encodeURIComponent(query)}`) }} /><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={19} /></button></div>
            <span className="section-tag">{query ? `${searchMatches.length} MATCHING PIECES` : 'POPULAR RIGHT NOW'}</span>
            <div className="search-results">
              {(query ? searchMatches : products.slice(0, 5)).slice(0, 5).map((p) => <button key={p.id} onClick={() => go(`/product/${p.slug}`)}><img src={p.image} alt="" /><span><b>{p.name}</b><small>{categoryOf(p)} · {money(p.price)}</small></span><ArrowUpRight size={17} /></button>)}
              {query && !searchMatches.length && <p className="muted">No pieces found. Try another search.</p>}
            </div>
            <button className="text-btn" onClick={() => go(`/search?q=${encodeURIComponent(query)}`)}>VIEW ALL RESULTS <ArrowRight size={15} /></button>
          </section>
        </div>, document.body,
      )}
      {toast && <Toast message={toast.message} kind={toast.kind} />}
      <button className="sr-only" onClick={() => setDrawer('cart')}>Open bag</button>
    </div>
  )
}

function Footer({ go, settings }: { go: (path: string) => void; settings: ReturnType<typeof getSettings> }) {
  const groups = [
    { title: 'SHOP', links: [['All pieces', '/shop'], ['T-shirts', '/shop?category=T-SHIRTS'], ['Hoodies', '/shop?category=HOODIES']] },
    { title: 'HELP', links: [['Contact', '/contact'], ['Delivery', '/info/shipping'], ['Returns', '/info/returns'], ['Size & fit', '/info/about']] },
    { title: 'STORE', links: [['Our story', '/info/about'], ['Privacy', '/info/privacy'], ['Terms', '/info/terms'], ['Admin', '/signin']] },
  ]
  return <footer className="footer">
    <div className="footer-main section-pad">
      <div className="footer-brand">
        <button onClick={() => go('/')} aria-label="Home">{settings.brandName}<sup>®</sup></button>
        <p>Everyday essentials.<br />Unmistakable style.</p>
        {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`}>{settings.supportEmail} <ArrowUpRight size={13} /></a>}
      </div>
      <div className="footer-groups">
        {groups.map((group) => <div className="footer-group" key={group.title}>
          <b>{group.title}</b>
          {group.links.map(([label, path]) => <button key={label} onClick={() => go(path)}>{label}</button>)}
        </div>)}
      </div>
    </div>
    <div className="footer-mega" aria-hidden="true">{settings.brandName}</div>
    <div className="footer-bottom section-pad">
      <span>© {new Date().getFullYear()} {settings.brandName} STORE · TUNISIA</span>
      <span>PAY ON DELIVERY · DELIVERY ACROSS TUNISIA</span>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>BACK TO TOP ↑</button>
    </div>
  </footer>
}

function Drawer({ type, close, go, cart, updateCart, subtotal }: {
  type: Exclude<DrawerType, null>; close: () => void; go: (path: string) => void; cart: CartLine[]
  updateCart: (key: string, qty: number) => void; subtotal: number
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('modal-open')
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open') }
  }, [close])
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0)
  const discount = multiBuySavings(cart)

  return createPortal(
    <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
      <aside className={`drawer drawer-${type}`} role="dialog" aria-modal="true" aria-label={type === 'cart' ? 'Shopping bag' : 'Navigation'}>
        <header className="drawer-head">
          <div><span className="section-tag">{type === 'cart' ? 'YOUR BAG' : 'MENU'}</span>{type === 'cart' && <b>{itemCount} {itemCount === 1 ? 'piece' : 'pieces'}</b>}</div>
          <button onClick={close} aria-label="Close"><X size={20} /></button>
        </header>
        {type === 'menu' ? (
          <nav className="drawer-menu">
            {[['SHOP ALL', '/shop'], ['T-SHIRTS', '/shop?category=T-SHIRTS'], ['HOODIES', '/shop?category=HOODIES'], ['OUR STORY', '/info/about'], ['CONTACT', '/contact']].map(([label, path]) => <button key={label} onClick={() => go(path)}>{label}<ArrowRight size={17} /></button>)}
          </nav>
        ) : (
          <>
            {cart.length ? <div className="drawer-items">{cart.map((line) => {
              const p = getProducts().find((item) => item.id === line.productId)
              if (!p) return null
              const variant = productVariant(p, line.color)
              return <article className="drawer-item" key={line.key}>
                <button className="drawer-item-img" onClick={() => go(`/product/${p.slug}`)} aria-label={`View ${p.name}`}><img src={variant?.images[0] || p.image} alt="" /></button>
                <div className="drawer-item-info">
                  <button className="drawer-item-name" onClick={() => go(`/product/${p.slug}`)}>{p.name}</button>
                  <small>{p.type} · {line.size} · {variant?.name || line.color}</small>
                  <div className="drawer-item-controls">
                    <div className="qty-control"><button onClick={() => updateCart(line.key, line.qty - 1)} aria-label="Decrease quantity"><Minus size={13} /></button><span>{line.qty}</span><button onClick={() => updateCart(line.key, line.qty + 1)} aria-label="Increase quantity"><Plus size={13} /></button></div>
                    <button className="remove-btn" onClick={() => updateCart(line.key, 0)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <strong>{money(p.price * line.qty)}</strong>
              </article>
            })}</div> : <div className="drawer-empty"><ShoppingBag size={28} /><h3>Your bag is empty.</h3><p>Find something you'll reach for every day.</p></div>}
            {cart.length > 0 && <div className="drawer-foot">
              <div className="drawer-summary"><span>SUBTOTAL</span><strong>{money(subtotal)}</strong></div>
              {discount > 0 && <div className="drawer-saving"><Check size={14} /> {money(discount)} multi-buy saving applied</div>}
              <button className="solid-btn full" onClick={() => go('/checkout')}>CHECKOUT <ArrowRight size={16} /></button>
              <button className="quiet-btn full" onClick={() => go('/cart')}>VIEW BAG</button>
            </div>}
          </>
        )}
      </aside>
    </div>, document.body,
  )
}

export default App
