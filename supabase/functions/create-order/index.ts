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
const requestCounts = new Map<string, { count: number; resetAt: number }>()

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const limit = requestCounts.get(ip)
  if (limit && limit.resetAt > now && limit.count >= 5) return json({ error: 'Too many order attempts. Please wait a minute and try again.' }, 429)
  requestCounts.set(ip, limit && limit.resetAt > now ? { count: limit.count + 1, resetAt: limit.resetAt } : { count: 1, resetAt: now + 60_000 })

  try {
    const projectUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!projectUrl || !serviceKey) return json({ error: 'Order service is not configured.' }, 503)

    const payload = await request.json()
    if (clean(payload.website, 200)) return json({ error: 'Could not place this order.' }, 400)

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
    const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: products, error: productsError } = await admin.from('products').select('id,name,price,stock,image,sizes,colors').in('id', ids)
    if (productsError || !products || products.length !== ids.length) return json({ error: 'One or more items are no longer available.' }, 400)

    const items = requestedItems.map((requested: Record<string, unknown>) => {
      const product = products.find((entry) => entry.id === clean(requested.productId, 80))
      const qty = Number(requested.qty)
      const size = clean(requested.size, 20)
      const color = clean(requested.color, 30)
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error('Check item quantities and try again.')
      if (product.sizes.length && !product.sizes.includes(size)) throw new Error('A selected size is no longer available.')
      if (product.colors.length && !product.colors.includes(color)) throw new Error('A selected color is no longer available.')
      if (product.stock !== null && product.stock < qty) throw new Error('An item in your bag is out of stock.')
      return { key: `${product.id}-${size}-${color}`, productId: product.id, name: product.name, price: Number(product.price), image: product.image, qty, size, color }
    })
    const total = items.reduce((sum: number, item: { price: number; qty: number }) => sum + item.price * item.qty, 0)
    const id = `K7-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const { data: saved, error: saveError } = await admin.from('orders').insert({
      id,
      total,
      items,
      status: 'New',
      ...order,
    }).select('id,created_at,total').single()
    if (saveError || !saved) return json({ error: 'We could not save your order. Please try again.' }, 500)
    return json({ order: saved })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Order could not be placed.'
    return json({ error: message }, 400)
  }
})
