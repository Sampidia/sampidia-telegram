import { Item } from '@/app/data/items';

export interface Purchase {
  userId: string;
  itemId: string;
  timestamp: number;
  transactionId: string;
}

export interface CurrentPurchaseWithSecret {
  item: Item;
  transactionId: string;
  timestamp: number;
  secret: string;
} 