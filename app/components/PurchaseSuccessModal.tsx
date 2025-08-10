'use client';

import { Item } from '@/app/data/items';

interface CurrentPurchaseWithSecret {
  item?: Item;
  transactionId: string;
  timestamp: number;
  secret?: string;
}

interface PurchaseSuccessModalProps {
  currentPurchase: CurrentPurchaseWithSecret;
  onClose: () => void;
}

export default function PurchaseSuccessModal({ currentPurchase, onClose }: PurchaseSuccessModalProps) {
  if (!currentPurchase.item) return null;

  return (
    <div className="fixed inset-0 bg-[#808080] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{currentPurchase.item.icon}</div>
          <h3 className="text-xl font-bold">{currentPurchase.item.name}</h3>
          <p className="text-sm tg-hint">Purchase successful!</p>
        </div>

        {currentPurchase.secret && (
          <div className="my-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-sm font-semibold mb-1">Your Secret Code:</p>
            <p className="font-mono text-lg font-bold">{currentPurchase.secret}</p>
          </div>
        )}

        <div className="mt-4 text-sm tg-hint">
          <p className="mb-2">Need a refund?</p>
          <p>Please open our Telegram bot and use the appropriate <code>/refund</code> command to request a refund.</p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full tg-button cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
} 