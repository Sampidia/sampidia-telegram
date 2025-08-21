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
  onRetry?: () => void;
  error?: string | null;
}

export default function PurchaseHistory({ 
  purchases, 
  items, 
  onViewSecret, 
  onWithdraw,
  isLoading = false,
  onRetry,
  error
}: PurchaseHistoryProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Purchase History</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading purchases...</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 underline"
            >
              Retry
            </button>
          )}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-3">Failed to load purchase history</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-4">
          <p className="tg-hint mb-3">No purchases yet. Buy something to see it here!</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Purchases
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">{purchases.length} purchase(s)</span>
            {onRetry && (
              <button 
                onClick={onRetry}
                className="text-sm text-blue-500 hover:text-blue-600 underline"
              >
                Refresh
              </button>
            )}
          </div>
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
        </div>
      )}
    </div>
  );
} 