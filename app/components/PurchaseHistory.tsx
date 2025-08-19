'use client';

import { Item } from '@/app/data/items';
import { Purchase } from '@/app/types';
import PurchaseHistoryItem from './PurchaseHistoryItem';

interface PurchaseHistoryProps {
  purchases: Purchase[];
  items: Item[];
  onViewSecret: (purchase: Purchase) => void;
  onWithdraw: (transactionId: string) => void;
}

export default function PurchaseHistory({ 
  purchases, 
  items, 
  onViewSecret, 
  onWithdraw 
}: PurchaseHistoryProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
      {purchases.length === 0 ? (
        <p className="text-center py-4 tg-hint">
          No purchases yet. Buy something to see it here!
        </p>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => {
            const item = items.find(i => i.id === purchase.itemId);
            return (
              <PurchaseHistoryItem
                key={purchase.transactionId}
                purchase={purchase}
                item={item}
                onViewSecret={onViewSecret}
                onWithdraw={onWithdraw}
              />
            );
          })}
        </div>
      )}
    </div>
  );
} 