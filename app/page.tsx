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
import WithdrawalInstructionsModal from '@/app/components/WithdrawalInstructionsModal';

export default function Home() {
  const [initialized, setInitialized] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'purchase' | 'withdraw' | null;
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
        setIsLoading(false); // Set loading to false after initialization
      } catch (e) {
        console.error('Failed to initialize Telegram Web App:', e);
        setError('Failed to initialize Telegram Web App');
        setInitialized(true);
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []);

  // Fetch user balance
  useEffect(() => {
    if (initialized && userId) {
      fetchUserBalance();
    }
  }, [initialized, userId]);

  // Fetch purchase history
  useEffect(() => {
    if (initialized && userId) {
      fetchPurchases();
    }
  }, [initialized, userId]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isLoadingPurchases) {
      const timeout = setTimeout(() => {
        console.warn('Purchase history loading timed out');
        setIsLoadingPurchases(false);
        setPurchases([]);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingPurchases]);

  // Set up periodic balance updates
  useEffect(() => {
    if (initialized && userId) {
      // Update balance every 30 seconds
      const interval = setInterval(() => {
        fetchUserBalance();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [initialized, userId]);

  const fetchUserBalance = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user-balance?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance || 0);
      }
    } catch (e) {
      console.error('Error fetching user balance:', e);
      // Don't show error for balance fetch, just keep current value
    }
  };

  const fetchPurchases = async () => {
    if (!userId) return;
    
    setIsLoadingPurchases(true);
    setPurchaseError(null); // Clear any previous errors
    try {
      const response = await fetch(`/api/purchases?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch purchases');
      }
      
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch (e) {
      console.error('Error fetching purchases:', e);
      setPurchaseError('Failed to load purchase history');
      setPurchases([]);
    } finally {
      setIsLoadingPurchases(false);
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
      setIsLoading(false); // Hide loading before opening the payment UI

      // Import TWA SDK
      const WebApp = (await import('@twa-dev/sdk')).default;
      
      // For Telegram Stars, open the invoice directly in the Mini App
      WebApp.openInvoice(invoiceLink, async (status) => {
        if (status === 'paid') {
          // Payment was successful
          console.log('Payment successful!');
          
          // Show success message
          alert('✅ Payment successful! Your purchase has been completed.');
          
          // Refresh purchases to show the new purchase
          await fetchPurchases();
          
          // Update user balance after successful payment
          await fetchUserBalance();
        } else if (status === 'failed') {
          alert('❌ Payment failed. Please try again.');
        } else if (status === 'cancelled') {
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

  // Redirect users to the bot for withdraw
  const handleWithdraw = (transactionId: string) => {
    setModalState({ type: 'withdraw' });
  };

  // Handle retry on error
  const handleRetry = () => {
    window.location.reload();
  };

  // Handle retry for purchase history
  const handleRetryPurchases = () => {
    fetchPurchases();
  };

  // Close modals
  const handleCloseModal = () => {
    setModalState({ type: null });
  };

  // Loading state - only show for initialization, not for purchase history
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
      
      {modalState.type === 'withdraw' && (
        <WithdrawalInstructionsModal
          onClose={handleCloseModal}
        />
      )}
      
      {/* User Balance Display */}
      <div className="flex items-center justify-center mb-4 p-3 bg-gray-800 rounded-lg">
        <span className="text-white text-lg font-semibold">
          Balance: {userBalance.toLocaleString()}
        </span>
        <span className="text-yellow-400 text-xl ml-2">⭐</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">Digital Store</h1>
      
      <ItemsList 
        items={ITEMS}
        onPurchase={handlePurchase}
      />
      
      <PurchaseHistory
        purchases={purchases}
        items={ITEMS}
        onViewSecret={revealSecret}
        onWithdraw={handleWithdraw}
        isLoading={isLoadingPurchases}
        onRetry={handleRetryPurchases}
        error={purchaseError}
      />
    </div>
  );
}
