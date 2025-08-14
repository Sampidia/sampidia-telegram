'use client';
import { supabase } from '@/utils/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ITEMS, Item } from '@/app/data/items';
import { Purchase, CurrentPurchaseWithSecret } from '@/app/types';
import type { UserData } from '@/types/user';

// Import components
import LoadingState from '@/app/components/LoadingState';
import ErrorState from '@/app/components/ErrorState';
import ItemsList from '@/app/components/ItemsList';
import PurchaseHistory from '@/app/components/PurchaseHistory';
import PurchaseSuccessModal from '@/app/components/PurchaseSuccessModal';
import RefundInstructionsModal from '@/app/components/RefundInstructionsModal';

// Initialize Supabase client for client-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DatabaseItem {
  price: number;
  // Add other expected properties from your database
}

interface HomeClientProps {
  initialData: DatabaseItem[];
  serverError: string | null;
}

export default function HomeClient({ serverError }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [balance, setBalance] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'ton'>('bank');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState<string | null>(serverError);
  
  const [modalState, setModalState] = useState<{
    type: 'purchase' | 'refund' | null;
    purchase?: CurrentPurchaseWithSecret;
  }>({ type: null });

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawData, setWithdrawData] = useState({
    stars: '',
    accountNumber: '',
    accountName: '',
    bankName: '',
    telegramUsername: '',
    tonAddress: '',
  });

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWithdrawData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitWithdraw = async () => {
    const quantity = Number(withdrawData.stars);
    if (isNaN(quantity) || quantity < (withdrawMethod === 'bank' ? 10 : 100)) {
      alert(`Please enter a valid withdrawal of total stars of at least ${withdrawMethod === 'bank' ? 10 : 100}.`);
      return;
    }
    
    if (quantity > (balance ?? 0)) {
      alert("Withdrawal quantity exceeds your available balance.");
      return;
    }

    setWithdrawing(true);

    try {
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: quantity,
          withdrawMethod, // This is now being used
        ...(withdrawMethod === 'bank' ? {
          accountNumber: withdrawData.accountNumber,
          accountName: withdrawData.accountName,
          bankName: withdrawData.bankName
        } : {
          tonAddress: withdrawData.tonAddress // This is now being used
        }),
        username: userData?.username || ''
      }),
    });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process withdrawal");
      }

      const data = await response.json();
      setBalance(data.newBalance);

      alert("Withdrawal request submitted successfully!");
      setShowWithdrawModal(false);
      setWithdrawData({
        stars: '',
        accountNumber: '',
        accountName: '',
        bankName: '',
        telegramUsername: '',
        tonAddress: '',
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setWithdrawing(false);
    }
  };

  // Initialize Telegram Web App
  useEffect(() => {
    const initTelegram = async () => {
      try {
        // Dynamic import of the TWA SDK
        const WebApp = (await import('@twa-dev/sdk')).default;

        // Check if running within Telegram
        const isTelegram = WebApp.isExpanded !== undefined;

        if (isTelegram) {
          WebApp.ready();
          WebApp.expand();

          // Get user data from Telegram
          const tg = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: UserData } } } }).Telegram?.WebApp;
          const user = tg?.initDataUnsafe?.user;

          if (user) {
            const cleanUser: UserData = {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name || '',
              username: user.username || '',
              language_code: user.language_code || '',
              is_premium: user.is_premium || false,
            };

            setUserData(cleanUser);
            setUserId(cleanUser.id.toString());

            // Save to Supabase via API route
            fetch('/api/saveUser', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(cleanUser),
            });
          } else {
            setError('No user data available from Telegram');
            setIsLoading(false);
          }
        } else {
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

  // Fetch purchases
  const fetchPurchases = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/purchases?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch purchases');
      const data = await response.json();
      setPurchases(data.purchases || []);
    } catch {
      setError('Failed to load purchase history');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch balance when userId is available
  useEffect(() => {
    if (!userId) return;

    async function fetchBalance() {
      try {
        const { data, error } = await supabase
          .from("purchases")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching balance:", error);
          setBalance(0); // Default to 0 if no balance found
          return;
        }

        setBalance(data?.balance || 0);
      } catch (err) {
        console.error("Error in fetchBalance:", err);
        setBalance(0);
      }
    }

    fetchBalance();
  }, [userId]);

  // Fetch purchases when initialized and userId is available
  useEffect(() => {
    if (initialized && userId) {
      fetchPurchases();
    }
  }, [initialized, userId, fetchPurchases]);

  const handlePurchase = async (item: Item) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const { invoiceLink } = await response.json();
      setIsLoading(false);

      const WebApp = (await import('@twa-dev/sdk')).default;

      WebApp.openInvoice(invoiceLink, async (status) => {
        if (status === 'paid') {
          setIsLoading(true);
          const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

          try {
            const paymentResponse = await fetch('/api/payment-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                itemId: item.id,
                transactionId,
              }),
            });

            if (!paymentResponse.ok) {
              throw new Error('Failed to record payment');
            }

            // Update balance
            const updateBalanceResponse = await fetch('/api/update-balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, price: item.price }),
            });

            if (!updateBalanceResponse.ok) {
              throw new Error('Failed to update balance');
            }

            const { balance: updatedBalance } = await updateBalanceResponse.json();
            setBalance(updatedBalance);

            const { secret } = await paymentResponse.json();

            setModalState({
              type: 'purchase',
              purchase: {
                item,
                transactionId,
                timestamp: Date.now().toString(),
                secret,
              },
            });

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

  const revealSecret = async (purchase: Purchase) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/get-secret?itemId=${purchase.itemId}&transactionId=${purchase.transactionId}`);

      if (!response.ok) {
        throw new Error('Failed to retrieve secret code');
      }

      const { secret } = await response.json();
      const item = ITEMS.find((i) => i.id === purchase.itemId);

      if (item) {
        setModalState({
          type: 'purchase',
          purchase: {
            item,
            transactionId: purchase.transactionId,
            timestamp: purchase.timestamp,
            secret,
          },
        });
      }
    } catch (e) {
      console.error('Error fetching secret:', e);
      alert('Unable to retrieve the secret code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = () => {
    setModalState({ type: 'refund' });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleCloseModal = () => {
    setModalState({ type: null });
  };

  // Loading state
  if (!initialized || isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20">
        {activeTab === 1 && (
          <>
            <div className="max-w-md mx-auto p-4 pb-20">
              {modalState.type === 'purchase' && modalState.purchase && modalState.purchase.item && (
                <PurchaseSuccessModal 
                  currentPurchase={{
                    ...modalState.purchase,
                    timestamp: typeof modalState.purchase.timestamp === 'string' 
                      ? parseInt(modalState.purchase.timestamp) 
                      : modalState.purchase.timestamp
                  }} 
                  onClose={handleCloseModal} 
                />
              )}

              {modalState.type === 'refund' && <RefundInstructionsModal onClose={handleCloseModal} />}

              <h1 className="text-2xl font-bold mb-6 text-center">User Data</h1>
              {userData ? (
                <ul>
                  <li>ID: {userData.id}</li>
                  <li>First Name: {userData.first_name}</li>
                  <li>Last Name: {userData.last_name || 'N/A'}</li>
                  <li>Username: {userData.username || 'N/A'}</li>
                  <li>Language Code: {userData.language_code}</li>
                  <li>Is Premium: {userData.is_premium ? 'Yes' : 'No'}</li>
                </ul>
              ) : (
                <div>No user data available.</div>
              )}
              
              <h2 className="text-2xl font-bold mb-6 text-center">Total Balance</h2>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  background: "#d6f5ec",
                  padding: "1rem",
                  borderRadius: "8px",
                  display: "inline-block",
                  margin: "1rem 0",
                  textAlign: "center",
                }}
              >
                Balance: {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) + " ⭐" : "Loading..."}
              </div>

              <div className="flex justify-center gap-8 mt-6">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl"
                  >
                    <i className="fa-regular fa-paper-plane"></i>
                  </button>
                  <span className="mt-2 text-center text-sm">Withdraw</span>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl"
                    onClick={() => {
                      document.getElementById("sell-stars")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                  >
                    <i className="fa-regular fa-plus"></i>
                  </button>
                  <span className="mt-2 text-center text-sm">Add</span>
                </div>

                <div className="flex flex-col items-center">
                  <a
                    href="https://t.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl"
                  >
                    <i className="fa-regular fa-comment-dots"></i>
                  </a>
                  <span className="mt-2 text-center text-sm">Support</span>
                </div>
              </div>

              {/* Withdraw Modal */}
              {showWithdrawModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded-lg w-96 max-w-[90vw]">
                    <h2 className="text-xl font-semibold mb-4">Withdraw</h2>

                    <div className="mb-4">
                      <label className="mr-6">
                        <input
                          type="radio"
                          name="withdrawMethod"
                          value="bank"
                          checked={withdrawMethod === 'bank'}
                          onChange={() => setWithdrawMethod('bank')}
                          className="mr-2"
                        />
                        Bank Transfer (Min: 10)
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="withdrawMethod"
                          value="ton"
                          checked={withdrawMethod === 'ton'}
                          onChange={() => setWithdrawMethod('ton')}
                          className="mr-2"
                        />
                        TON Wallet (Min: 100)
                      </label>
                    </div>

                    <input
                      type="number"
                      name="stars"
                      min={withdrawMethod === 'bank' ? 10 : 100}
                      max={balance ?? undefined}
                      value={withdrawData.stars}
                      onChange={handleWithdrawChange}
                      placeholder={`Total stars to withdraw (min ${withdrawMethod === 'bank' ? 10 : 100})`}
                      className="w-full border rounded-lg px-3 py-2 mb-4"
                    />

                    {withdrawMethod === 'bank' && (
                      <>
                        <input
                          type="text"
                          name="bankName"
                          value={withdrawData.bankName}
                          onChange={handleWithdrawChange}
                          placeholder="Bank Name"
                          className="w-full border rounded-lg px-3 py-2 mb-4"
                        />
                        <input
                          type="text"
                          name="accountNumber"
                          value={withdrawData.accountNumber}
                          onChange={handleWithdrawChange}
                          placeholder="Account Number"
                          className="w-full border rounded-lg px-3 py-2 mb-4"
                        />
                        <input
                          type="text"
                          name="accountName"
                          value={withdrawData.accountName}
                          onChange={handleWithdrawChange}
                          placeholder="Account Name"
                          className="w-full border rounded-lg px-3 py-2 mb-4"
                        />
                      </>
                    )}

                    {withdrawMethod === 'ton' && (
                      <input
                        type="text"
                        name="tonAddress"
                        value={withdrawData.tonAddress}
                        onChange={handleWithdrawChange}
                        placeholder="TON Wallet Address"
                        className="w-full border rounded-lg px-3 py-2 mb-4"
                      />
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={submitWithdraw}
                        disabled={withdrawing}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {withdrawing ? 'Processing...' : 'Submit'}
                      </button>
                      <button
                        onClick={() => setShowWithdrawModal(false)}
                        className="px-4 py-2 border rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <h2 id="sell-stars" className="text-2xl font-bold mb-6 text-center">
                Sell Stars
              </h2>

              <ItemsList items={ITEMS} onPurchase={handlePurchase} />

              <PurchaseHistory 
                purchases={purchases} 
                items={ITEMS} 
                onViewSecret={revealSecret} 
                onRefund={handleRefund} 
              />
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

      {/* Mobile Tab Navigation */}
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
