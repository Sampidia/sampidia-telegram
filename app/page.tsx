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
  const [user, setUser] = useState<any>(null);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    type: 'purchase' | 'withdraw' | null;
    purchase?: CurrentPurchaseWithSecret;
  }>({ type: null });

  // Fixed Telegram initialization useEffect
  useEffect(() => {
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
            const telegramUser = WebApp.initDataUnsafe.user;
            setUserId(telegramUser.id?.toString() || '');
            
            // Send user data to API
            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(telegramUser),
            });
            
            const data = await response.json();
            if (data.error) {
              setError(data.error);
            } else {
              setUser(data);
            }
          } else {
            setError('No user data available from Telegram');
          }
        } else {
          setError('This application can only be accessed from within Telegram');
        }
      } catch (err) {
        console.error('Failed to initialize Telegram Web App:', err);
        setError('Failed to initialize Telegram Web App');
      } finally {
        setInitialized(true);
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []); // Fixed dependency array

  // Fixed increase points handler
  const handleIncreasePoints = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: user.telegramId }),
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, points: data.points });
        setNotification('Points increased successfully!');
        setTimeout(() => setNotification(''), 3000);
      } else {
        setError('Failed to increase points');
      }
    } catch (err) {
      setError('An error occurred while increasing points');
    }
  };

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

  // Fixed purchase handler
  const handlePurchase = async (item: Item) => {
    try {
      setIsLoading(true);
      
      // Create invoice link through API
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
      setIsLoading(false);

      // Import TWA SDK
      const WebApp = (await import('@twa-dev/sdk')).default;

      // Open the invoice using Telegram's WebApp SDK
      WebApp.openInvoice(invoiceLink, async (status) => {
        if (status === 'paid') {
          setIsLoading(true);
          
          // Generate transaction ID
          const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          try {
            // Store the successful payment
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
            
            // Show the success modal with secret code - Fixed to match CurrentPurchaseWithSecret type
            const purchase: CurrentPurchaseWithSecret = {
              transactionId,
              timestamp: Date.now(),
              secret,
              balance: user?.balance || 0,
              // Use the full item object instead of just the id
              item: item,
              // Add any other required properties from CurrentPurchaseWithSecret type
            };

            // Set modal state with the purchase
            setModalState({
              type: 'purchase',
              purchase: {
                ...purchase,
                item // Add item reference for modal compatibility
              } as any // Type assertion to handle the additional item property
            });
            
            // Refresh purchases list
            await fetchPurchases();
          } catch (e) {
            console.error('Error saving payment:', e);
            alert('Your payment was successful, but we had trouble saving your purchase. Please contact support.');
          } finally {
            setIsLoading(false);
          }
        } else if (status === 'failed') {
          alert('Payment failed. Please try again.');
          setIsLoading(false);
        } else if (status === 'cancelled') {
          console.log('Payment was cancelled by user');
          setIsLoading(false);
        }
      });
    } catch (e) {
      console.error('Error during purchase:', e);
      alert(`Failed to process purchase: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  // Fixed reveal secret function
  const revealSecret = async (purchase: Purchase) => {
    try {
      setIsLoading(true);
      
      // Get the item ID - handle both string and Item object cases
      setIsLoading(true);
      const response = await fetch(`/api/get-secret?itemId=${purchase.itemId}&transactionId=${purchase.transactionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to retrieve secret code');
      }
      
      const { secret } = await response.json();
      
      // Find the item using the extracted ID
       const item = ITEMS.find(i => i.id === purchase.itemId);
      
      if (item) {
        setModalState({
          type: 'purchase',
          purchase: {
            transactionId: purchase.transactionId,
            timestamp: purchase.timestamp,
            secret,
            balance: user?.balance || 0,
            itemid: item, // Use full item object
            item // Add item reference for modal
          } as any // Type assertion for the additional item property
        });
      }
    } catch (err) {
      console.error('Error fetching secret:', err);
      alert('Unable to retrieve the secret code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed withdrawal function
  const handleWithdrawRequest = async (transactionId: string) => {
    try {
      // Add your withdrawal logic here
      console.log("Processing withdrawal for transaction:", transactionId);
      // You can add API call here if needed
    } catch (error) {
      console.error("Withdrawal error:", error);
    }
  };

  // Fixed withdrawal modal handler
  const handleWithdraw = (purchase: CurrentPurchaseWithSecret) => {
    setModalState({
      type: 'withdraw',
      purchase
    });
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

  // Check if user is loaded
  if (!user) {
    return <LoadingState />;
  }

  // Main app UI
  return (
    <div className="container mx-auto p-4">
      <div className="pb-20">
        {activeTab === 1 && (
          <>
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>
              <p>Your current points: {user.points}</p>
              
              <button 
                onClick={handleIncreasePoints}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              >
                Increase Points
              </button>
              
              {notification && (
                <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
                  {notification}
                </div>
              )}
            </div>

            <div className="max-w-md mx-auto p-4 pb-20">
              {modalState.type === 'purchase' && modalState.purchase && (modalState.purchase as any).item && (
                <PurchaseSuccessModal
                  currentPurchase={{
                    ...modalState.purchase,
                    timestamp: modalState.purchase.timestamp.toString() // Convert number to string
                  } as any}
                  onClose={handleCloseModal}
                />
              )}
              
              {modalState.type === 'withdraw' && (
                <WithdrawalInstructionsModal
                  onClose={handleCloseModal}
                />
              )}
              
              <h2 className="text-2xl font-bold mb-6 text-center">Sell Stars</h2>
              
              <ItemsList 
                items={ITEMS}
                onPurchase={handlePurchase}
              />
              
              {purchases.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Purchase History</h3>
                  
                    
                   
                      
                        <PurchaseHistory
                          purchases={purchases}
                          items={ITEMS}
                          onViewSecret={revealSecret}
                          onWithdraw={handleWithdrawRequest}
                        />
                      
                   
                  
                </div>
              )}
            </div>       

            <div className="mt-12 pb-6 text-center">
              <p className="text-xs text-gray-400">
                Made with <span className="text-red-500">❤️</span> for SamPidia.
              </p>
            </div>
          </>
        )}
        
        {activeTab === 2 && (
          <div className="w-full" style={{height:'calc(100vh - 72px)'}}>
            <iframe 
              src="https://sampidia.com" 
              title="Tab 2" 
              className="w-full h-full border-none" 
            />
          </div>
        )}

        {activeTab === 3 && (
          <div className="w-full" style={{height:'calc(100vh - 72px)'}}>
            <iframe 
              src="https://connect.sampidia.com" 
              title="Tab 3" 
              className="w-full h-full border-none" 
            />
          </div>
        )}

        {activeTab === 4 && (
          <div className="w-full" style={{height:'calc(100vh - 72px)'}}>
            <iframe 
              src="https://ai.sampidia.com" 
              title="Tab 4" 
              className="w-full h-full border-none" 
            />
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center z-50" style={{maxWidth:'500px',margin:'0 auto'}}>
        <div className="flex w-full mx-4 my-2 bg-white rounded-full shadow-lg px-2 py-2" style={{gap:'8px'}}>
          
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 flex justify-center items-center transition-all ${activeTab===1?'bg-gray-100 rounded-full':''}`}
            style={{height:'48px'}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab===1?"#222":"#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </button>

          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 flex justify-center items-center transition-all ${activeTab===2?'bg-gray-100 rounded-full':''}`}
            style={{height:'48px'}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab===2?"#222":"#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
            </svg>
          </button>

          <button
            onClick={() => setActiveTab(3)}
            className={`flex-1 flex justify-center items-center transition-all ${activeTab===3?'bg-gray-100 rounded-full':''}`}
            style={{height:'48px'}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab===3?"#222":"#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </button>

          <button
            onClick={() => setActiveTab(4)}
            className={`flex-1 flex justify-center items-center transition-all ${activeTab===4?'bg-gray-100 rounded-full':''}`}
            style={{height:'48px'}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab===4?"#222":"#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </button>
        </div>
      </div>
    </div> 
  );
}