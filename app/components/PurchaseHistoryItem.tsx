import React from 'react';
import { Item } from '@/app/data/items';
import { Purchase } from '@/app/types';

interface PurchaseHistoryItemProps {
  purchase: Purchase;
  item?: Item;
  onViewSecret: (purchase: Purchase) => void;
  onWithdraw: (transactionId: string) => void;
}

export default function PurchaseHistoryItem({ 
  purchase, 
  item, 
  onViewSecret, 
  onWithdraw 
}: PurchaseHistoryItemProps) {
  // Helper function to safely get the item name
  const getItemName = () => {
    if (item?.name) {
      return item.name;
    }

    // If purchase has an itemId and it's a string, return it
    if (typeof purchase.itemId === 'string') {
      return purchase.itemId;
    }

    // Check for transaction ID as fallback
    if (typeof purchase.transactionId === 'string') {
      return purchase.transactionId;
    }

    // Fallback
    return 'Unknown Item';
  };

  // Helper function to safely get transaction ID
  const getTransactionId = (): string => {
    // Check for transaction ID
    if (typeof purchase.transactionId === 'string') {
      return purchase.transactionId;
    }

    // Fallback to itemId if transactionId is not available
    if (typeof purchase.itemId === 'string') {
      return purchase.itemId;
    }

    return '';
  };

  // Helper function to safely format the timestamp
  const getFormattedDate = (): string => {
    if (purchase.createdAt) {
      const date = new Date(purchase.createdAt);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      // If parsing fails, return the raw timestamp
      return String(purchase.createdAt);
    }

    return 'Date not available';
  };

  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
      <div className="text-2xl mr-3">{item?.icon || '🎁'}</div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{getItemName()}</h3>
        <p className="text-xs tg-hint">
          {getFormattedDate()}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <button 
          onClick={() => onViewSecret(purchase)}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          View Secret
        </button>
        <button 
          onClick={() => onWithdraw(getTransactionId())}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}