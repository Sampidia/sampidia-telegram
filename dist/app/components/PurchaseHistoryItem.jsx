import React from 'react';
export default function PurchaseHistoryItem({ purchase, item, onViewSecret, onWithdraw }) {
    // Helper function to safely get the item name
    const getItemName = () => {
        if (item === null || item === void 0 ? void 0 : item.name) {
            return item.name;
        }
        // If purchase has an itemid and it's a string, return it (corrected property name)
        if (typeof purchase.itemId === 'string') {
            return purchase.itemId;
        }
        // Check for various possible transaction ID property names
        if (typeof purchase.transactionId === 'string') {
            return purchase.transactionId;
        }
        if (typeof purchase.transactionId === 'string') {
            return purchase.transactionId;
        }
        if (typeof purchase.id === 'string') {
            return purchase.id;
        }
        // Fallback
        return 'Unknown Item';
    };
    // Helper function to safely get transaction ID
    const getTransactionId = () => {
        // Check for various possible transaction ID property names
        if (typeof purchase.transactionId === 'string') {
            return purchase.transactionId;
        }
        if (typeof purchase.transactionId === 'string') {
            return purchase.transactionId;
        }
        if (typeof purchase.id === 'string') {
            return purchase.id;
        }
        return '';
    };
    return (<div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
      <div className="text-2xl mr-3">{(item === null || item === void 0 ? void 0 : item.icon) || '🎁'}</div>
      <div className="flex-1">
        <h3 className="font-medium">{getItemName()}</h3>
        <p className="text-xs tg-hint">
          {new Date(purchase.timestamp).toLocaleString()}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <button onClick={() => onViewSecret(purchase)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
          View Secret
        </button>
        <button onClick={() => onWithdraw(getTransactionId())} className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">
          Withdraw
        </button>
      </div>
    </div>);
}
