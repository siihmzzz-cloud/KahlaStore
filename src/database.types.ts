export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type ProductRow = {
  id: string
  slug: string
  name: string
  category: string
  type: string
  price: number
  stock: number | null
  image: string
  image2: string
  images: string[]
  variants: Json
  colors: string[]
  sizes: string[]
  featured: boolean
  newest: boolean
  description: string
  created_at: string
  updated_at: string
}

type CategoryRow = { name: string; sort_order: number }
type SettingsRow = { id: string; brand_name: string; announcement: string; currency: string; support_email: string; shipping_note: string; returns_note: string; updated_at: string }
type DiscountRow = { id: string; code: string; amount: number; active: boolean; created_at: string }
type OrderRow = { id: string; created_at: string; total: number; items: Json; status: 'New' | 'Processing' | 'Shipped' | 'Complete' | 'Cancelled'; customer_name: string | null; email: string | null; phone: string | null; address: string | null; city: string | null; postal_code: string | null; delivery_notes: string | null }

export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow, Omit<ProductRow, 'created_at' | 'updated_at'> & Partial<Pick<ProductRow, 'created_at' | 'updated_at'>>>
      categories: Table<CategoryRow, CategoryRow>
      store_settings: Table<SettingsRow, SettingsRow>
      discounts: Table<DiscountRow, Omit<DiscountRow, 'created_at'> & Partial<Pick<DiscountRow, 'created_at'>>>
      orders: Table<OrderRow, OrderRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
