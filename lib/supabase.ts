import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper types for our database tables
export interface PaymentRequest {
  request_id: string
  user_id: string
  item_id: string
  status: 'pending' | 'paid' | 'failed'
  created_at: string
  transaction_id?: string
  price: number
}

export interface Purchase {
  user_id: string
  item_id: string
  telegram_payment_charge_id: string
  transaction_id: string
  status: 'completed' | 'refunded'
  timestamp: string
}
