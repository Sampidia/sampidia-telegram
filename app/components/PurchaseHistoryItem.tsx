'use client';

import { Item } from '@/app/data/items';
import { Purchase } from '@/app/types';

interface PurchaseHistoryItemProps {
  purchase: Purchase;
  item?: Item;
  onViewSecret: (purchase: Purchase) => void;
  onRefund: (transactionId: string) => void;
}

export default function PurchaseHistoryItem({ 
  purchase, 
  item, 
  onViewSecret, 
  onRefund 
}: PurchaseHistoryItemProps) {
  return (
    <div className="p-3 rounded-lg shadow-sm tg-card">
      <div className="flex items-center">
        <div className="text-2xl mr-3">{item?.icon || '🎁'}</div>
        <div className="flex-1">
          <h3 className="font-medium">{item?.name || purchase.itemId}</h3>
          <p className="text-xs tg-hint">
            {new Date(purchase.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="text-sm">{item?.price || '?'} ⭐</div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <p className="text-xs tg-hint">
          ID: {purchase.transactionId.substring(0, 10)}...
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewSecret(purchase)}
            className="text-xs tg-link cursor-pointer"
          >
            View Code
          </button>
          <button
            onClick={() => onRefund(purchase.transactionId)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            Refund
          </button>
        </div>
      </div>
    </div>
  );
} 