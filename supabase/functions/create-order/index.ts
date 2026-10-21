import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const clean = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const SHIPPING_FEE = 8
const requestCounts = new Map<string, { count: number; resetAt: number }>()

const notifyTelegram = async (order: Record<string, unknown>, items: Array<Record<string, unknown>>, total: number) => {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return false
  const itemLines = items.map((item) => `• ${item.name} — ${item.qty} × ${item.price} DT | ${item.size} | ${item.colorName || item.color}`).join('\n')
  const message = [
    'NEW KA7LA STORE ORDER',
    `Order: ${order.id}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.phone}`,
    `Email: ${order.email}`,
    `Address: ${order.address}, ${order.city} ${order.postal_code}`,
    order.delivery_notes ? `Delivery notes: ${order.delivery_notes}` : '',
    '',
    'ITEMS',
    itemLines,
    '',
    `TOTAL (incl. 8 DT shipping): ${total} DT`,
  ].filter(Boolean).join('\n').slice(0, 4000)
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  })
  if (!response.ok) throw new Error(`Telegram returned HTTP ${response.status}`)
  return true
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const projectUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!projectUrl || !serviceKey) return json({ error: 'Order service is not configured.' }, 503)

    const payload = await request.json()
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown'
    const rateKey = `${ip}:${payload.action === 'validate_discount' ? 'discount' : 'order'}`
    const now = Date.now()
    const limit = requestCounts.get(rateKey)
    const maxAttempts = payload.action === 'validate_discount' ? 12 : 5
    if (limit && limit.resetAt > now && limit.count >= maxAttempts) return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429)
    requestCounts.set(rateKey, limit && limit.resetAt > now ? { count: limit.count + 1, resetAt: limit.resetAt } : { count: 1, resetAt: now + 60_000 })
    if (clean(payload.website, 200)) return json({ error: 'Could not place this order.' }, 400)
    const discountCode = clean(payload.discountCode, 40).toUpperCase()
    const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    if (payload.action === 'validate_discount') {
      if (!discountCode) return json({ valid: false, error: 'Enter a discount code first.' }, 400)
      const { data: discount, error } = await admin.from('discounts').select('code,amount,active').eq('code', discountCode).eq('active', true).maybeSingle()
      if (error || !discount) return json({ valid: false, error: 'This code is invalid or inactive.' }, 400)
      if (!Number.isFinite(Number(discount.amount)) || Number(discount.amount) < 1 || Number(discount.amount) > 90) return json({ valid: false, error: 'This discount is not configured correctly.' }, 400)
      return json({ valid: true, code: discount.code, amount: Number(discount.amount) })
    }

    const customer = payload.customer ?? {}
    const order = {
      customer_name: clean(customer.name, 120),
      email: clean(customer.email, 254).toLowerCase(),
      phone: clean(customer.phone, 32),
      address: clean(customer.address, 220),
      city: clean(customer.city, 100),
      postal_code: clean(customer.postalCode, 24),
      delivery_notes: clean(customer.deliveryNotes, 500),
    }
    if (order.customer_name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email) || order.phone.length < 7 || order.address.length < 5 || order.city.length < 2 || order.postal_code.length < 2) {
      return json({ error: 'Check your contact and delivery details.' }, 400)
    }

    const requestedItems = Array.isArray(payload.items) ? payload.items : []
    if (!requestedItems.length || requestedItems.length > 20) return json({ error: 'Your bag could not be checked.' }, 400)
    const ids = [...new Set(requestedItems.map((item: Record<string, unknown>) => clean(item.productId, 80)).filter(Boolean))]
    const { data: products, error: productsError } = await admin.from('products').select('id,name,price,stock,image,sizes,colors,variants').in('id', ids)
    if (productsError || !products || products.length !== ids.length) return json({ error: 'One or more items are no longer available.' }, 400)

    const items = requestedItems.map((requested: Record<string, unknown>) => {
      const product = products.find((entry) => entry.id === clean(requested.productId, 80))
      const qty = Number(requested.qty)
      const size = clean(requested.size, 20)
      const color = clean(requested.color, 30)
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error('Check item quantities and try again.')
      const variants = Array.isArray(product.variants) ? product.variants : []
      const variant = variants.find((item: { color?: string }) => item.color === color)
      if (variants.length && !variant) throw new Error('The selected color is no longer available.')
      if (variant) {
        if (!Array.isArray(variant.sizes) || !variant.sizes.includes(size)) throw new Error('That size is not available in the selected color.')
      } else {
        if (product.sizes.length && !product.sizes.includes(size)) throw new Error('A selected size is no longer available.')
        if (product.colors.length && !product.colors.includes(color)) throw new Error('A selected color is no longer available.')
      }
      if (product.stock !== null && product.stock < qty) throw new Error('An item in your bag is out of stock.')
      return { key: `${product.id}-${size}-${color}`, productId: product.id, name: product.name, price: Number(product.price), image: variant?.images?.[0] || product.image, qty, size, color, colorName: variant?.name || color }
    })
    const subtotal = items.reduce((sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty, 0)
    let discount = 0
    if (discountCode) {
      const { data: coupon, error } = await admin.from('discounts').select('amount,active').eq('code', discountCode).eq('active', true).maybeSingle()
      if (error || !coupon) return json({ error: 'This discount code is invalid or no longer active.' }, 400)
      if (!Number.isFinite(Number(coupon.amount)) || Number(coupon.amount) < 1 || Number(coupon.amount) > 90) return json({ error: 'This discount is not configured correctly.' }, 400)
      discount = Math.round(subtotal * Number(coupon.amount)) / 100
    }
    const total = Math.max(0, subtotal - discount) + SHIPPING_FEE
    const id = `K7-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const { data: saved, error: saveError } = await admin.from('orders').insert({
      id,
      total,
      items,
      status: 'New',
      ...order,
    }).select('id,created_at,total').single()
    if (saveError || !saved) return json({ error: 'We could not save your order. Please try again.' }, 500)
    let notificationSent = false
    try {
      notificationSent = await notifyTelegram({ id: saved.id, ...order }, items, total)
    } catch (error) {
      console.error('Telegram order notification failed:', error instanceof Error ? error.message : 'Unknown error')
    }
    return json({ order: saved, notificationSent })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Order could not be placed.'
    return json({ error: message }, 400)
  }
})
