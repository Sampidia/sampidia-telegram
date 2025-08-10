'use client';

import { useEffect, useState } from 'react';
import { ITEMS, Item } from '@/app/data/items';
import { Purchase, CurrentPurchaseWithSecret } from '@/app/types';

// Import components
import LoadingState from '@/app/components/LoadingState';
import ErrorState from '@/app/components/ErrorState';
import ItemsList from '@/app/components/ItemsList';
import PurchaseHistory from '@/app/components/PurchaseHistory';
import PurchaseSuccessModal from '@/app/components/PurchaseSuccessModal';
import RefundInstructionsModal from '@/app/components/RefundInstructionsModal';

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'purchase' | 'refund' | null;
    purchase?: CurrentPurchaseWithSecret;
  }>({ type: null });

  useEffect(() => {
    // Import TWA SDK dynamically to avoid SSR issues
    const initTelegram = async () => {
      try {
        // Dynamic import of the TWA SDK
        const WebApp = (await import('@twa-dev/sdk')).default;
        
        // Check if running within Telegram
        const isTelegram = WebApp.isExpanded !== undefined;
        
        if (isTelegram) {
          // Initialize Telegram Web App
          WebApp.ready();
          WebApp.expand();
          
          // Get user ID from initData
          if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            // Access user data directly from the WebApp object
            const user = WebApp.initDataUnsafe.user;
            setUserId(user.id?.toString() || '');
          } else {
            setError('No user data available from Telegram');
            setIsLoading(false);
          }
        } else {
          // Not in Telegram, set an error message
          setError('This application can only be accessed from within Telegram');
          setIsLoading(false);
        }

        setInitialized(true);
      } catch (e) {
        console.error('Failed to initialize Telegram Web App:', e);
        setError('Failed to initialize Telegram Web App');
        setInitialized(true);
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []);

  // Fetch purchase history
  useEffect(() => {
    if (initialized && userId) {
      fetchPurchases();
    }
  }, [initialized, userId]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/purchases?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (e) {
      console.error('Error fetching purchases:', e);
      setError('Failed to load purchase history');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (item: Item) => {
    try {
      setIsLoading(true); // Show loading indicator when starting purchase
      // Create invoice link through our API
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemId: item.id,
          userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const { invoiceLink } = await response.json();
      setIsLoading(false); // Hide loading before opening the invoice UI

      // Import TWA SDK
      const WebApp = (await import('@twa-dev/sdk')).default;
      
      // Open the invoice using Telegram's WebApp SDK
      WebApp.openInvoice(invoiceLink, async (status) => {
        if (status === 'paid') {
          setIsLoading(true); // Show loading during processing after payment
          // Payment was successful
          // Generate a mock transaction ID since we don't have access to the real one from Telegram
          // In a production app, this would be retrieved from your backend after the bot
          // receives the pre_checkout_query and successful_payment updates
          const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          
          try {
            // Store the successful payment and get the secret code
            const paymentResponse = await fetch('/api/payment-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId,
                itemId: item.id,
                transactionId
              })
            });

            if (!paymentResponse.ok) {
              throw new Error('Failed to record payment');
            }

            const { secret } = await paymentResponse.json();
            
            // Show the success modal with secret code
            setModalState({
              type: 'purchase',
              purchase: {
                item,
                transactionId,
                timestamp: Date.now(),
                secret
              }
            });
            
            // Refresh purchases list
            await fetchPurchases();
          } catch (e) {
            console.error('Error saving payment:', e);
            alert('Your payment was successful, but we had trouble saving your purchase. Please contact support.');
            setIsLoading(false); // Ensure loading is turned off after error
          }
        } else if (status === 'failed') {
          alert('Payment failed. Please try again.');
        } else if (status === 'cancelled') {
          // User cancelled the payment, no action needed
          console.log('Payment was cancelled by user');
        }
      });
    } catch (e) {
      console.error('Error during purchase:', e);
      alert(`Failed to process purchase: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setIsLoading(false); // Ensure loading is turned off after error
    }
  };

  // Function to reveal secret for past purchases
  const revealSecret = async (purchase: Purchase) => {
    try {
      // Fetch the secret from the server for this purchase
      setIsLoading(true);
      const response = await fetch(`/api/get-secret?itemId=${purchase.itemId}&transactionId=${purchase.transactionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to retrieve secret code');
      }
      
      const { secret } = await response.json();
      const item = ITEMS.find(i => i.id === purchase.itemId);
      
      if (item) {
        setModalState({
          type: 'purchase',
          purchase: {
            item,
            transactionId: purchase.transactionId,
            timestamp: purchase.timestamp,
            secret
          }
        });
      }
    } catch (e) {
      console.error('Error fetching secret:', e);
      alert('Unable to retrieve the secret code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect users to the bot for refunds
  const handleRefund = (transactionId: string) => {
    setModalState({ type: 'refund' });
  };

  // Handle retry on error
  const handleRetry = () => {
    window.location.reload();
  };

  // Close modals
  const handleCloseModal = () => {
    setModalState({ type: null });
  };

  // Loading state
  if (!initialized || isLoading) {
    return <LoadingState />;
  }

  // Error state (including not in Telegram)
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Main app UI
  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      {modalState.type === 'purchase' && modalState.purchase && modalState.purchase.item && (
        <PurchaseSuccessModal
          currentPurchase={modalState.purchase}
          onClose={handleCloseModal}
        />
      )}
      
      {modalState.type === 'refund' && (
        <RefundInstructionsModal
          onClose={handleCloseModal}
        />
      )}
      
      <h1 className="text-2xl font-bold mb-6 text-center">Digital Store</h1>
      
      <ItemsList 
        items={ITEMS}
        onPurchase={handlePurchase}
      />
      
      <PurchaseHistory
        purchases={purchases}
        items={ITEMS}
        onViewSecret={revealSecret}
        onRefund={handleRefund}
      />
    </div>
  );
}
