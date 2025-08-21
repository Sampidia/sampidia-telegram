'use client';
import { useEffect, useState } from 'react';
import { ITEMS } from '@/app/data/items';
// Import components
import LoadingState from '@/app/components/LoadingState';
import ErrorState from '@/app/components/ErrorState';
import ItemsList from '@/app/components/ItemsList';
import PurchaseHistory from '@/app/components/PurchaseHistory';
import PurchaseSuccessModal from '@/app/components/PurchaseSuccessModal';
import WithdrawalInstructionsModal from '@/app/components/WithdrawalInstructionsModal';
export default function Home() {
    const [initialized, setInitialized] = useState(false);
    const [userId, setUserId] = useState('');
    const [userFirstName, setUserFirstName] = useState('');
    const [userTelegramId, setUserTelegramId] = useState('');
    const [userBalance, setUserBalance] = useState(0);
    const [purchases, setPurchases] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
    const [error, setError] = useState(null);
    const [purchaseError, setPurchaseError] = useState(null);
    const [modalState, setModalState] = useState({ type: null });
    const [activeTab, setActiveTab] = useState(1); // New state for active tab
    // State for withdrawal modal
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawMethod, setWithdrawMethod] = useState('bank');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawData, setWithdrawData] = useState({
        stars: '',
        accountNumber: '',
        accountName: '',
        bankName: '',
        telegramUsername: '', // This might not be needed if we use ctx.from.username
        tonAddress: '',
    });
    // Handle withdrawal form changes
    const handleWithdrawChange = (e) => {
        const { name, value } = e.target;
        setWithdrawData((prev) => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    // Submit withdrawal request
    const submitWithdraw = async () => {
        const quantity = Number(withdrawData.stars);
        const minWithdrawal = withdrawMethod === 'bank' ? 10 : 100;
        if (isNaN(quantity) || quantity < minWithdrawal) {
            alert(`Please enter a valid withdrawal of total stars of at least ${minWithdrawal}.`);
            return;
        }
        if (quantity > (userBalance !== null && userBalance !== void 0 ? userBalance : 0)) {
            alert("Withdrawal quantity exceeds your available balance.");
            return;
        }
        setWithdrawing(true);
        try {
            const response = await fetch("/api/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(Object.assign(Object.assign({ userId, amount: quantity, withdrawMethod }, (withdrawMethod === 'bank' ? {
                    accountNumber: withdrawData.accountNumber,
                    accountName: withdrawData.accountName,
                    bankName: withdrawData.bankName
                } : {
                    tonAddress: withdrawData.tonAddress
                })), { username: userFirstName // Using userFirstName as a placeholder for username
                 })),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to process withdrawal");
            }
            const data = await response.json();
            setUserBalance(data.newBalance); // Update user balance
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
        }
        catch (error) {
            alert(error instanceof Error ? error.message : "Unknown error");
        }
        finally {
            setWithdrawing(false);
        }
    };
    useEffect(() => {
        // Import TWA SDK dynamically to avoid SSR issues
        const initTelegram = async () => {
            var _a, _b;
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
                        const currentUserId = ((_a = user.id) === null || _a === void 0 ? void 0 : _a.toString()) || '';
                        setUserId(currentUserId);
                        setUserFirstName(user.first_name || '');
                        setUserTelegramId(((_b = user.id) === null || _b === void 0 ? void 0 : _b.toString()) || '');
                        // Call API to save user data to database
                        try {
                            await fetch('/api/user', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    telegramId: currentUserId,
                                    firstName: user.first_name || '',
                                    username: user.username || '',
                                }),
                            });
                            console.log('User data sent to API for saving/updating.');
                        }
                        catch (apiError) {
                            console.error('Error sending user data to API:', apiError);
                        }
                    }
                    else {
                        setError('No user data available from Telegram');
                        setIsLoading(false);
                    }
                }
                else {
                    // Not in Telegram, set an error message
                    setError('This application can only be accessed from within Telegram');
                    setIsLoading(false);
                }
                setInitialized(true);
                setIsLoading(false); // Set loading to false after initialization
            }
            catch (e) {
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
        if (!userId)
            return;
        try {
            const response = await fetch(`/api/user-balance?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserBalance(data.balance || 0);
            }
        }
        catch (e) {
            console.error('Error fetching user balance:', e);
            // Don't show error for balance fetch, just keep current value
        }
    };
    const fetchPurchases = async () => {
        if (!userId)
            return;
        setIsLoadingPurchases(true);
        setPurchaseError(null); // Clear any previous errors
        try {
            const response = await fetch(`/api/purchases?userId=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch purchases');
            }
            const data = await response.json();
            setPurchases(data.purchases || []);
        }
        catch (e) {
            console.error('Error fetching purchases:', e);
            setPurchaseError('Failed to load purchase history');
            setPurchases([]);
        }
        finally {
            setIsLoadingPurchases(false);
        }
    };
    const handlePurchase = async (item) => {
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
                }
                else if (status === 'failed') {
                    alert('❌ Payment failed. Please try again.');
                }
                else if (status === 'cancelled') {
                    console.log('Payment was cancelled by user');
                }
            });
        }
        catch (e) {
            console.error('Error during purchase:', e);
            alert(`Failed to process purchase: ${e instanceof Error ? e.message : 'Unknown error'}`);
            setIsLoading(false); // Ensure loading is turned off after error
        }
    };
    // Function to reveal secret for past purchases
    const revealSecret = async (purchase) => {
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
        }
        catch (e) {
            console.error('Error fetching secret:', e);
            alert('Unable to retrieve the secret code. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    // Redirect users to the bot for withdraw
    const handleWithdraw = (transactionId) => {
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
        return <ErrorState error={error} onRetry={handleRetry}/>;
    }
    // Main app UI
    return (<div className="max-w-md mx-auto p-4 pb-20">
      {modalState.type === 'purchase' && modalState.purchase && modalState.purchase.item && (<PurchaseSuccessModal currentPurchase={modalState.purchase} onClose={handleCloseModal}/>)}
      
      {modalState.type === 'withdraw' && (<WithdrawalInstructionsModal onClose={handleCloseModal}/>)}

      {/* Conditional rendering based on activeTab */}
      <div className="pb-20"> {/* Added pb-20 to ensure content is not hidden by footer */}
        {activeTab === 1 && (<>
            {/* User Info Display */}
            <div className="flex flex-col items-center justify-center mb-4 p-3 bg-gray-800 rounded-lg text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome back {userFirstName}!</h2>
              <p className="text-lg">Your Telegram ID: {userTelegramId}</p>
            </div>

            {/* User Balance Display */}
            <div className="flex items-center justify-center mb-4 p-3 bg-gray-800 rounded-lg">
              <span className="text-white text-lg font-semibold">
                Balance: {userBalance.toLocaleString()}
              </span>
              <span className="text-yellow-400 text-xl ml-2">⭐</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-8 mt-6 mb-8">
              <div className="flex flex-col items-center">
                <button onClick={() => setShowWithdrawModal(true)} className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', width: '24px', height: '24px' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M10.3009 13.6949L20.102 3.89742M10.5795 14.1355L12.8019 18.5804C13.339 19.6545 13.6075 20.1916 13.9458 20.3356C14.2394 20.4606 14.575 20.4379 14.8492 20.2747C15.1651 20.0866 15.3591 19.5183 15.7472 18.3818L19.9463 6.08434C20.2845 5.09409 20.4535 4.59896 20.3378 4.27142C20.2371 3.98648 20.013 3.76234 19.7281 3.66167C19.4005 3.54595 18.9054 3.71502 17.9151 4.05315L5.61763 8.2523C4.48114 8.64037 3.91289 8.83441 3.72478 9.15032C3.56153 9.42447 3.53891 9.76007 3.66389 10.0536C3.80791 10.3919 4.34498 10.6605 5.41912 11.1975L9.86397 13.42C10.041 13.5085 10.1295 13.5527 10.2061 13.6118C10.2742 13.6643 10.3352 13.7253 10.3876 13.7933C10.4468 13.87 10.491 13.9585 10.5795 14.1355Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> {/* Withdraw icon */}
                </button>
                <span className="mt-2 text-center text-sm">Withdraw</span>
              </div>

              <div className="flex flex-col items-center">
                <a href="https://t.me/pidia2211?text=1%20want%20to%20send%20stars%20to%20USERNAME?" target="_blank" rel="noopener noreferrer" className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', width: '24px', height: '24px' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20.7639 12H10.0556M3 8.00003H5.5M4 12H5.5M4.5 16H5.5M9.96153 12.4896L9.07002 15.4486C8.73252 16.5688 8.56376 17.1289 8.70734 17.4633C8.83199 17.7537 9.08656 17.9681 9.39391 18.0415C9.74792 18.1261 10.2711 17.8645 11.3175 17.3413L19.1378 13.4311C20.059 12.9705 20.5197 12.7402 20.6675 12.4285C20.7961 12.1573 20.7961 11.8427 20.6675 11.5715C20.5197 11.2598 20.059 11.0295 19.1378 10.5689L11.3068 6.65342C10.2633 6.13168 9.74156 5.87081 9.38789 5.95502C9.0808 6.02815 8.82627 6.24198 8.70128 6.53184C8.55731 6.86569 8.72427 7.42461 9.05819 8.54246L9.96261 11.5701C10.0137 11.7411 10.0392 11.8266 10.0493 11.9137C10.0583 11.991 10.0582 12.069 10.049 12.1463C10.0387 12.2334 10.013 12.3188 9.96153 12.4896Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> {/* Send icon */}
                </a>
                <span className="mt-2 text-center text-sm">Send</span>
              </div>

              <div className="flex flex-col items-center">
                <button className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl" onClick={() => {
                var _a;
                // Scroll to the "Add" (sell stars) section
                (_a = document.getElementById("sampidia-store-heading")) === null || _a === void 0 ? void 0 : _a.scrollIntoView({
                    behavior: "smooth",
                });
            }}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g data-name="add" id="add-2"> <g> <line fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="12" x2="12" y1="19" y2="5"></line> <line fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="5" x2="19" y1="12" y2="12"></line> </g> </g> </g> </g></svg> {/* Add icon */}
                </button>
                <span className="mt-2 text-center text-sm">Add</span>
              </div>

              <div className="flex flex-col items-center">
                <a href="https://t.me/pidia2211" // Replace with actual support chat link
         target="_blank" rel="noopener noreferrer" className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl">
                  <svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xmlSpace="preserve" style={{ fill: '#000000' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path style={{ fill: 'none', stroke: '#ffffff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M5,17.4v-3.5C5,7.9,9.9,3,16,3s11,4.9,11,10.9l0,3.5"></path> <path style={{ fill: 'none', stroke: '#ffffff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M27,15v3.4C27,24.3,22.1,29,16,29l0-2l3,0"></path> <path style={{ fill: 'none', stroke: '#ffffff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M9,22v-8c-2.2,0-4,1.8-4,4S6.8,22,9,22z"></path> <path style={{ fill: 'none', stroke: '#ffffff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 10 }} d="M23,14v8c2.2,0,4-1.8,4-4S25.2,14,23,14z"></path> </g></svg> {/* Chat/Support icon */}
                </a>
                <span className="mt-2 text-center text-sm">Support</span>
              </div>
            </div>

            {/* Withdraw Modal */}
            {showWithdrawModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-96 max-w-[90vw]">
                  <h2 className="text-xl font-semibold mb-4 text-black">Withdraw</h2>

                  <div className="mb-4 text-black">
                    <label className="mr-6">
                      <input type="radio" name="withdrawMethod" value="bank" checked={withdrawMethod === 'bank'} onChange={() => setWithdrawMethod('bank')} className="mr-2"/>
                      Bank Transfer (Min: 10)
                    </label>
                    <label>
                      <input type="radio" name="withdrawMethod" value="ton" checked={withdrawMethod === 'ton'} onChange={() => setWithdrawMethod('ton')} className="mr-2"/>
                      TON Wallet (Min: 100)
                    </label>
                  </div>

                  <input type="number" name="stars" min={withdrawMethod === 'bank' ? 10 : 100} max={userBalance !== null && userBalance !== void 0 ? userBalance : undefined} value={withdrawData.stars} onChange={handleWithdrawChange} placeholder={`Total stars to withdraw (min ${withdrawMethod === 'bank' ? 10 : 100})`} className="w-full border rounded-lg px-3 py-2 mb-4 text-black"/>

                  {withdrawMethod === 'bank' && (<>
                      <input type="text" name="bankName" value={withdrawData.bankName} onChange={handleWithdrawChange} placeholder="Bank Name" className="w-full border rounded-lg px-3 py-2 mb-4 text-black"/>
                      <input type="text" name="accountNumber" value={withdrawData.accountNumber} onChange={handleWithdrawChange} placeholder="Account Number" className="w-full border rounded-lg px-3 py-2 mb-4 text-black"/>
                      <input type="text" name="accountName" value={withdrawData.accountName} onChange={handleWithdrawChange} placeholder="Account Name" className="w-full border rounded-lg px-3 py-2 mb-4 text-black"/>
                    </>)}

                  {withdrawMethod === 'ton' && (<input type="text" name="tonAddress" value={withdrawData.tonAddress} onChange={handleWithdrawChange} placeholder="TON Wallet Address" className="w-full border rounded-lg px-3 py-2 mb-4 text-black"/>)}

                  <div className="flex gap-2">
                    <button onClick={submitWithdraw} disabled={withdrawing} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                      {withdrawing ? 'Processing...' : 'Submit'}
                    </button>
                    <button onClick={() => setShowWithdrawModal(false)} className="px-4 py-2 border rounded-lg text-black">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>)}
            
            <h1 id="sampidia-store-heading" className="text-2xl font-bold mb-6 text-center">SamPidia Store</h1>
            
            <ItemsList items={ITEMS} onPurchase={handlePurchase}/>
            
            <PurchaseHistory purchases={purchases} items={ITEMS} onViewSecret={revealSecret} onWithdraw={handleWithdraw} isLoading={isLoadingPurchases} onRetry={handleRetryPurchases} error={purchaseError}/>
          </>)}
        
        {activeTab === 2 && (<>
          <div className="w-full h-full" style={{ height: 'calc(100vh - 120px)' }}>
            <iframe src="https://sampidia.com" title="Tab 2" className="w-full h-full border-none"/>
          </div>
          </>)}

        {activeTab === 3 && (<div className="w-full h-full" style={{ height: 'calc(100vh - 120px)' }}>
            <iframe src="https://connect.sampidia.com" title="Tab 3" className="w-full h-full border-none"/>
          </div>)}

        {activeTab === 4 && (<div className="w-full h-full" style={{ height: 'calc(100vh - 120px)' }}>
            <iframe src="https://ai.sampidia.com" title="Tab 4" className="w-full h-full border-none"/>
          </div>)}
      </div>

      {/* Mobile Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center z-50" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="flex w-full mx-4 my-2 bg-white rounded-full shadow-lg px-2 py-2" style={{ gap: '8px' }}>
          
          <button onClick={() => setActiveTab(1)} className={`flex-1 flex justify-center items-center transition-all ${activeTab === 1 ? 'bg-gray-100 rounded-full' : ''}`} style={{ height: '48px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab === 1 ? "#222" : "#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
            </svg>
          </button>

          <button onClick={() => setActiveTab(2)} className={`flex-1 flex justify-center items-center transition-all ${activeTab === 2 ? 'bg-gray-100 rounded-full' : ''}`} style={{ height: '48px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab === 2 ? "#222" : "#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"/>
            </svg>
          </button>

          <button onClick={() => setActiveTab(3)} className={`flex-1 flex justify-center items-center transition-all ${activeTab === 3 ? 'bg-gray-100 rounded-full' : ''}`} style={{ height: '48px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab === 3 ? "#222" : "#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/>
            </svg>
          </button>

          <button onClick={() => setActiveTab(4)} className={`flex-1 flex justify-center items-center transition-all ${activeTab === 4 ? 'bg-gray-100 rounded-full' : ''}`} style={{ height: '48px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={activeTab === 4 ? "#222" : "#888"} className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>);
}
