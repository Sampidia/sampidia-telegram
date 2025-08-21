'use client';

import { Item } from '@/app/data/items';
import { Purchase } from '@/app/types';
import PurchaseHistoryItem from './PurchaseHistoryItem';

interface PurchaseHistoryProps {
  purchases: Purchase[];
  items: Item[];
  onViewSecret: (purchase: Purchase) => void;
  onWithdraw: (transactionId: string) => void;
  isLoading?: boolean;
}

export default function PurchaseHistory({ 
  purchases, 
  items, 
  onViewSecret, 
  onWithdraw,
  isLoading = false
}: PurchaseHistoryProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading purchases...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-4">
          <p className="tg-hint mb-3">No purchases yet. Buy something to see it here!</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-blue-500 hover:text-blue-600 underline"
          >
            Refresh
          </button>
        </div>
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