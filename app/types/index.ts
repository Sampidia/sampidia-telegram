import { Item } from '@/app/data/items';

export interface Purchase {
  id: string;
  userId: string;
  telegramId: string;
  transactionId: string;
  productName: string;
  itemId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface CurrentPurchaseWithSecret {
  item: Item;
  transactionId: string;
  createdAt: string;
  secret: string;
}