import { Item } from '@/app/data/items';

export interface Purchase {
  userId: string;
  itemId: string;
  timestamp: string; // ✅ changed to string
  transactionId: string;
}

export interface CurrentPurchaseWithSecret {
  item: Item;
  transactionId: string;
  timestamp: string; // ✅ changed to string
  secret: string;
} 

export interface PaymentRequest {
  request_id: string;
  user_id: string;
  item_id: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  transaction_id?: string;
  price: number;
}

export interface Purchase {
  user_id: string;
  item_id: string;
  telegram_payment_charge_id: string;
  transaction_id: string;
  status: 'completed' | 'refunded';
  timestamp: string;
}
