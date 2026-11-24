import { isSupabaseConfigured, supabaseAnonKey, supabaseConfigMessage, supabaseUrl } from './supabaseConfig'

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type ProductVariant = { id: string; name: string; color: string; images: string[]; sizes: string[] }
export type Product = {
  id: string
  slug: string
  name: string
  category: string
  type: string
  price: number
  compareAtPrice?: number
  promoActive?: boolean
  stock?: number
  image: string
  image2: string
  images?: string[]
  colors: string[]
  sizes: string[]
  variants?: ProductVariant[]
  featured?: boolean
  newest?: boolean
  description?: string
}
export type CartLine = { key: string; productId: string; size: string; color: string; qty: number }
export type StoreSettings = {
  brandName: string
  announcement: string
  currency: string
  supportEmail: string
  shippingNote: string
  returnsNote: string
}
export type CheckoutDetails = {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  deliveryNotes: string
}
export type OrderItem = CartLine & {
  name: string
  price: number
  image: string
  colorName?: string
  quantityDiscountPercent?: number
  quantityDiscountAmount?: number
}
export type CustomerOrder = {
  id: string
  createdAt: string
  total: number
  items: OrderItem[]
  status: 'New' | 'Processing' | 'Shipped' | 'Complete' | 'Cancelled'
  customerName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  deliveryNotes?: string
}
export type SupportTicket = {
  id: string
  created_at: string
  customer_token: string
  name: string
  contact: string
  subject: string
  message: string
  status: 'New' | 'In progress' | 'Resolved'
}
export type SupportMessage = { id: string; ticket_id: string; created_at: string; sender: 'customer' | 'admin'; message: string }
export type SupportSession = { ticketId: string; customerToken: string }
export type Discount = { id: string; code: string; amount: number; active: boolean }
export type AdminSession = { email: string; role: 'admin' }

export type ProductRow = Omit<Product, 'stock' | 'featured' | 'newest' | 'description' | 'images' | 'variants' | 'compareAtPrice' | 'promoActive'> & {
  compare_at_price: number | null
  promo_active: boolean
  images: string[]
  variants: ProductVariant[]
  stock: number | null
  featured: boolean
  newest: boolean
  description: string
}
export type OrderRow = {
  id: string
  created_at: string
  total: number
  items: OrderItem[]
  status: CustomerOrder['status']
  customer_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  delivery_notes: string | null
}

/* ------------------------------------------------------------------ *
 * Constants + small helpers
 * ------------------------------------------------------------------ */

export const SHIPPING_FEE = 8
export const ADMIN_EMAIL = 'siihmzzz@gmail.com'
export { isSupabaseConfigured, supabaseConfigMessage }

export const CATEGORIES = [
  'T-SHIRTS',
  'HOODIES',
  'SHIRTS',
  'OUTERWEAR',
  'BOTTOMS',
  'KNITWEAR',
  'ACCESSORIES',
  'KIDS',
] as const

export const load = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
export const persist = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value))

export const defaultSettings: StoreSettings = {
  brandName: 'KA7LA',
  announcement: 'NEW SEASON / NEW ENERGY / DELIVERY ACROSS TUNISIA',
  currency: 'TND',
  supportEmail: 'siihmzzz@gmail.com',
  shippingNote: 'Flat-rate delivery: 8 DT across Tunisia. Orders are prepared within 48 hours.',
  returnsNote: 'Unworn pieces can be returned within 14 days of delivery. Contact support to start a return.',
}


/* ------------------------------------------------------------------ *
 * Live store state (module singletons kept in sync with Supabase)
 * ------------------------------------------------------------------ */

export let products: Product[] = load('ka7la-catalog', [] as Product[])
export let storeSettings: StoreSettings = { ...defaultSettings, ...load('ka7la-settings', {} as Partial<StoreSettings>) }

export const getProducts = () => products
export const getSettings = () => storeSettings
export const money = (n: number) => `${storeSettings.currency || 'TND'} ${Math.round(n)}`

export const productImages = (p: Product): string[] =>
  p.variants?.length
    ? [...new Set(p.variants.flatMap((variant) => variant.images).filter(Boolean))]
    : p.images?.length ? p.images.filter(Boolean) : [p.image, p.image2].filter(Boolean)

export const productVariants = (p: Product): ProductVariant[] =>
  p.variants?.length
    ? p.variants
    : p.colors.map((color, index) => ({
        id: `legacy-${index}`,
        name: color,
        color,
        images: p.images?.length ? p.images : [p.image, p.image2].filter(Boolean),
        sizes: p.sizes,
      }))

export const productVariant = (p: Product, color: string) => productVariants(p).find((variant) => variant.color === color)

export const categoryOf = (p: Product): string => {
  const haystack = `${p.name} ${p.type} ${p.category}`.toLowerCase()
  if (/hoodie|sweat|capuche|pullover/.test(haystack)) return 'HOODIES'
  if (/t[\s-]?shirt|tshirt|tee|maryoul/.test(haystack)) return 'T-SHIRTS'
  if (/jacket|coat|outer/.test(haystack)) return 'OUTERWEAR'
  if (/trouser|pant|short|jean|bottom/.test(haystack)) return 'BOTTOMS'
  if (/knit|jumper|sweater/.test(haystack)) return 'KNITWEAR'
  if (/kid|mini|little|2y|4y|6y|8y/.test(haystack)) return 'KIDS'
  if (/cap|tote|bag|accessor/.test(haystack)) return 'ACCESSORIES'
  if (/shirt|poplin|overshirt/.test(haystack)) return 'SHIRTS'
  return 'ESSENTIALS'
}

// Kept for admin/product compatibility with the original catalog shape.
export const storefrontCategory = (p: Product): 'T-shirt' | 'Hoodie' | null => {
  const name = `${p.name} ${p.type}`.toLowerCase()
  if (/hoodie|capuche|sweatshirt|sweat|pullover/.test(name)) return 'Hoodie'
  if (/t[\s-]?shirt|tshirt|tee|maryoul/.test(name)) return 'T-shirt'
  return null
}

export const activeDiscountPercent = (p: Product) =>
  p.promoActive && (p.compareAtPrice || 0) > p.price ? Math.round((1 - p.price / (p.compareAtPrice || 1)) * 100) : 0

export const multiBuyRate = (quantity: number) => (quantity >= 4 ? 16 : quantity === 3 ? 14 : quantity === 2 ? 6 : 0)
export const multiBuySavings = (cart: CartLine[]) => {
  const quantities = new Map<string, number>()
  cart.forEach((line) => quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.qty))
  return [...quantities].reduce((sum, [productId, quantity]) => {
    const product = products.find((item) => item.id === productId)
    return sum + (product ? Math.round(product.price * quantity * multiBuyRate(quantity)) / 100 : 0)
  }, 0)
}
export const lineMultiBuySavings = (cart: CartLine[], line: CartLine, price: number) =>
  Math.round(price * line.qty * multiBuyRate(cart.filter((item) => item.productId === line.productId).reduce((sum, item) => sum + item.qty, 0))) / 100

export const productFromRow = (row: ProductRow): Product => ({
  ...row,
  compareAtPrice: row.compare_at_price ?? undefined,
  promoActive: row.promo_active,
  variants: row.variants?.length ? row.variants : undefined,
  images: row.images?.length ? row.images : [row.image, row.image2].filter(Boolean),
  stock: row.stock ?? undefined,
  featured: row.featured,
  newest: row.newest,
  description: row.description,
})
export const productToRow = (product: Product): ProductRow => {
  const images = productImages(product)
  return {
    id: product.id, slug: product.slug, name: product.name, category: product.category, type: product.type,
    price: product.price, compare_at_price: product.compareAtPrice ?? null, promo_active: !!product.promoActive,
    image: images[0] || product.image, image2: images[1] || '', images, variants: product.variants || [],
    stock: product.stock ?? null, colors: product.colors, sizes: product.sizes, featured: !!product.featured,
    newest: !!product.newest, description: product.description ?? '',
  }
}
export const orderFromRow = (row: OrderRow): CustomerOrder => ({
  id: row.id, createdAt: row.created_at, total: Number(row.total), items: row.items || [], status: row.status,
  customerName: row.customer_name || 'Customer', email: row.email || '', phone: row.phone || '',
  address: row.address || '', city: row.city || '', postalCode: row.postal_code || '', deliveryNotes: row.delivery_notes || '',
})
const settingsFromRow = (row: Record<string, string>): StoreSettings => ({
  brandName: row.brand_name, announcement: row.announcement, currency: row.currency,
  supportEmail: row.support_email || defaultSettings.supportEmail,
  shippingNote: row.shipping_note || defaultSettings.shippingNote,
  returnsNote: row.returns_note || defaultSettings.returnsNote,
})
export const settingsToRow = (settings: StoreSettings) => ({
  id: 'default', brand_name: settings.brandName, announcement: settings.announcement, currency: settings.currency,
  support_email: settings.supportEmail, shipping_note: settings.shippingNote, returns_note: settings.returnsNote,
  updated_at: new Date().toISOString(),
})

/* ------------------------------------------------------------------ *
 * Remote data + mutations
 * ------------------------------------------------------------------ */

const restGet = (table: string, query: string) =>
  fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}`, Accept: 'application/json' },
  })

export const loadStoreData = async (onUpdate: () => void) => {
  if (!isSupabaseConfigured) return true
  const read = async (table: string, query: string): Promise<unknown[] | null> => {
    try {
      const response = await restGet(table, query)
      return response.ok ? await response.json() as unknown[] : null
    } catch {
      return null
    }
  }
  const [catalogRows, settingsRows] = await Promise.all([
    read('products', 'select=*&order=created_at.asc'),
    read('store_settings', 'select=*&id=eq.default&limit=1'),
  ])
  if (catalogRows) {
    products = (catalogRows as ProductRow[]).map(productFromRow)
    persist('ka7la-catalog', products)
    onUpdate()
  }
  if (settingsRows?.[0]) {
    storeSettings = settingsFromRow(settingsRows[0] as Record<string, string>)
    persist('ka7la-settings', storeSettings)
    onUpdate()
  }
  return Boolean(catalogRows && settingsRows)
}

export const saveCatalog = async (next: Product[], onUpdate: () => void) => {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.from('products').upsert(next.map(productToRow))
  if (error) throw error
  products = next
  persist('ka7la-catalog', next)
  onUpdate()
}

export const deleteCatalogProduct = async (id: string) => {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export const saveSettings = async (next: StoreSettings, onUpdate: () => void) => {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.from('store_settings').upsert(settingsToRow(next))
  if (error) throw error
  storeSettings = next
  persist('ka7la-settings', next)
  onUpdate()
}

export const signInAdmin = async (username: string, password: string) => {
  if (username.trim().toLowerCase() !== 'admin') throw new Error('Use the admin username to sign in.')
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password })
  if (error) throw error
  if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    await supabase.auth.signOut()
    throw new Error('This account is not authorized for store administration.')
  }
}
export const signOutAdmin = async () => {
  const { supabase } = await import('./supabase')
  const { error } = await supabase.auth.signOut()
  if (error) console.error('Admin sign out failed:', error.message)
}

export const validateDiscount = async (code: string): Promise<{ code: string; amount: number }> => {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.functions.invoke('create-order', { body: { action: 'validate_discount', discountCode: code } })
  if (error) {
    let message = error.message
    const context = (error as { context?: Response }).context
    if (context instanceof Response) {
      try { const details = await context.clone().json() as { error?: string }; if (details.error) message = details.error } catch { /* keep original */ }
    }
    throw new Error(message)
  }
  if (!data?.valid) throw new Error(data?.error || 'This code is not available.')
  return { code: data.code as string, amount: Number(data.amount) }
}

export type OrderResult = { order: { id: string; created_at: string; total: number }; notificationSent: boolean; emailSent: boolean }
export const placeOrder = async (customer: CheckoutDetails, discountCode: string, items: CartLine[]): Promise<OrderResult> => {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: { customer, discountCode, items: items.map(({ productId, qty, size, color }) => ({ productId, qty, size, color })) },
  })
  if (error) {
    let message = error.message
    const context = (error as { context?: Response }).context
    if (context instanceof Response) {
      try { const details = await context.clone().json() as { error?: string }; if (details.error) message = details.error } catch { /* keep original */ }
    }
    throw new Error(message)
  }
  if (!data?.order?.id) throw new Error('The order could not be confirmed. Please try again.')
  return data as OrderResult
}

export const supportErrorMessage = (reason: unknown) => {
  const info = reason && typeof reason === 'object'
    ? reason as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown }
    : {}
  const message = typeof info.message === 'string' ? info.message : typeof reason === 'string' ? reason : ''
  const code = typeof info.code === 'string' ? info.code : ''
  if (code === 'PGRST205' || code === '42P01' || /support_tickets.*(not found|schema cache|does not exist)/i.test(message))
    return 'The support inbox is unavailable right now. Please email us directly instead.'
  if (code === '42501' || /row-level security|permission denied/i.test(message))
    return 'The store rejected this request. Please try again or email us directly.'
  if (reason instanceof TypeError) return 'Could not reach the store. Check your connection and try again.'
  const extra = [typeof info.details === 'string' ? info.details : '', typeof info.hint === 'string' ? info.hint : ''].filter(Boolean).join(' · ')
  if (message) return `${message}${extra ? ` · ${extra}` : ''}${code ? ` (${code})` : ''}`
  return 'Your message could not be sent. Please try again.'
}

export const createSupportTicket = async (draft: { name: string; contact: string; subject: string; message: string }): Promise<SupportSession> => {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigMessage)
  const { supabase } = await import('./supabase')
  const next = { ticketId: crypto.randomUUID(), customerToken: crypto.randomUUID() }
  const { error } = await supabase.from('support_tickets').insert({
    id: next.ticketId, customer_token: next.customerToken, name: draft.name.trim(),
    contact: draft.contact.trim(), subject: draft.subject.trim(), message: draft.message.trim(), status: 'New',
  } as never)
  if (error) throw error
  persist('ka7la-support-session', next)
  return next
}

export const getSupportConversation = async (session: SupportSession) => {
  const { supabase } = await import('./supabase')
  const { data, error } = await (supabase as never as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: { ticket: { subject: string; status: string }; messages: SupportMessage[] } | null; error: { message: string } | null }>
  }).rpc('get_support_conversation', { p_ticket_id: session.ticketId, p_customer_token: session.customerToken })
  if (error) throw error
  if (!data?.ticket) throw new Error('This conversation could not be found on this device.')
  return data
}

export const sendSupportMessage = async (session: SupportSession, message: string) => {
  const { supabase } = await import('./supabase')
  const { error } = await (supabase as never as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
  }).rpc('send_support_message', { p_ticket_id: session.ticketId, p_customer_token: session.customerToken, p_message: message })
  if (error) throw error
}
