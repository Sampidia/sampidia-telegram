'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Item } from '@/app/data/items';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// Define types for Supabase data
interface PurchaseRecord {
  id: number;
  user_id: string;
  item_id: string;
  transaction_id: string;
  secret: string;
  created_at: string;
  amount: number;
  status: string;
}

interface UserData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  balance: number;
}

export default function PurchaseSuccessModal({ currentPurchase, onClose }: PurchaseSuccessModalProps) {
  const [purchaseData, setPurchaseData] = useState<PurchaseRecord | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch purchase data from Supabase
  useEffect(() => {
    const fetchPurchaseData = async () => {
      if (!currentPurchase.transactionId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch purchase record
        const { data: purchaseRecord, error: purchaseError } = await supabase
          .from('purchases') // Replace with your actual table name
          .select('*')
          .eq('transaction_id', currentPurchase.transactionId)
          .single();

        if (purchaseError) {
          throw purchaseError;
        }

        setPurchaseData(purchaseRecord);

        // Fetch user data if we have a user_id
        if (purchaseRecord?.user_id) {
          const { data: userRecord, error: userError } = await supabase
            .from('users') // Replace with your actual users table name
            .select('id, first_name, last_name, username, balance')
            .eq('id', purchaseRecord.user_id)
            .single();

          if (userError) {
            console.warn('Could not fetch user data:', userError);
          } else {
            setUserData(userRecord);
          }
        }

        // Alternative: You can also fetch related data using joins
        // const { data: purchaseWithUser, error: joinError } = await supabase
        //   .from('purchases')
        //   .select(`
        //     *,
        //     users (
        //       id,
        //       first_name,
        //       last_name,
        //       username,
        //       balance
        //     )
        //   `)
        //   .eq('transaction_id', currentPurchase.transactionId)
        //   .single();

      } catch (err) {
        console.error('Error fetching purchase data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load purchase data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchaseData();
  }, [currentPurchase.transactionId]);

  // Function to update purchase status if needed
  const updatePurchaseStatus = async (status: string) => {
    if (!purchaseData) return;

    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status })
        .eq('id', purchaseData.id);

      if (error) {
        throw error;
      }

      setPurchaseData(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error('Error updating purchase status:', err);
    }
  };

  if (!currentPurchase.item) return null;

  return (
    <div className="fixed inset-0 bg-[#808080] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">{currentPurchase.item.icon}</div>
          <h3 className="text-xl font-bold">{currentPurchase.item.name}</h3>
          <p className="text-sm tg-hint">Purchase successful!</p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-4">
            <p className="text-sm tg-hint">Loading purchase details...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="my-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg text-center">
            <p className="text-sm text-red-700 dark:text-red-300">
              Error: {error}
            </p>
          </div>
        )}

        {/* Purchase data from Supabase */}
        {purchaseData && !isLoading && (
          <div className="my-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <p className="text-sm font-semibold mb-2">Purchase Details:</p>
            <div className="text-xs space-y-1">
              <p><strong>ID:</strong> {purchaseData.id}</p>
              <p><strong>Amount:</strong> ${purchaseData.amount}</p>
              <p><strong>Status:</strong> {purchaseData.status}</p>
              <p><strong>Date:</strong> {new Date(purchaseData.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* User data from Supabase */}
        {userData && !isLoading && (
          <div className="my-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <p className="text-sm font-semibold mb-2">User Info:</p>
            <div className="text-xs space-y-1">
              <p><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
              {userData.username && <p><strong>Username:</strong> @{userData.username}</p>}
              <p><strong>Balance:</strong> ${userData.balance.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Secret code - prioritize Supabase data over props */}
        {(purchaseData?.secret || currentPurchase.secret) && (
          <div className="my-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-sm font-semibold mb-1">Your Secret Code:</p>
            <p className="font-mono text-lg font-bold">
              {purchaseData?.secret || currentPurchase.secret}
            </p>
          </div>
        )}

        <div className="mt-4 text-sm tg-hint">
          <p className="mb-2">Need a refund?</p>
          <p>Please open our Telegram bot and use the appropriate <code>/refund</code> command to request a refund.</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 tg-button cursor-pointer"
          >
            Close
          </button>
          
          {/* Optional: Add status update button */}
          {purchaseData && purchaseData.status !== 'completed' && (
            <button
              onClick={() => updatePurchaseStatus('completed')}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded cursor-pointer text-sm"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}