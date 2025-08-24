import { Item } from '@/app/data/items';

export interface Purchase {
  userId: string;
  itemId: string;
  timestamp: string;
  transactionId: string;
}

export interface CurrentPurchaseWithSecret {
  item: Item;
  transactionId: string;
  timestamp: string;
  secret: string;
} 