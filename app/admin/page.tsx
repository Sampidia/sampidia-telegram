'use client';

import { useEffect, useState } from 'react';

// Analytics charts types
interface WithdrawalStats {
  total: number;
  last24Hours: number;
  thisMonth: number;
  last3Months: number;
}

// Withdrawal data types
interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  withdrawMethod: 'bank' | 'ton';
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  tonAddress?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export default function AdminDashboard() {
  // Authentication state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [userTelegramId, setUserTelegramId] = useState('');
  const [loading, setLoading] = useState(true);

  // Dashboard data state
  const [stats, setStats] = useState<WithdrawalStats>({
    total: 0,
    last24Hours: 0,
    thisMonth: 0,
    last3Months: 0
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Authentication logic based on existing pattern
  useEffect(() => {
    const initAdminCheck = async () => {
      setLoading(true);

      try {
        // Use exact same authentication pattern as main app
        const WebApp = (await import('@twa-dev/sdk')).default;

        // Check if running within Telegram
        const isTelegram = WebApp.isExpanded !== undefined;

        console.log('Admin Auth - Telegram detection:', { isTelegram });

        if (isTelegram) {
          // Initialize Telegram Web App
          WebApp.ready();
          WebApp.expand();

          console.log('Admin Auth - WebApp initDataUnsafe:', WebApp.initDataUnsafe);

          // Get user data from WebApp
          if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            const user = WebApp.initDataUnsafe.user;
            const currentUserTelegramId = user.id?.toString() || '';

            console.log('Admin Auth - Real Telegram user found:', {
              userId: currentUserTelegramId,
              firstName: user.first_name
            });

            setUserTelegramId(currentUserTelegramId);

            // Check against NEXT_ADMIN env variable
            const adminTelegramId = process.env.NEXT_PUBLIC_NEXT_ADMIN || '1666422806';

            console.log('Admin Auth - Access check:', {
              userId: currentUserTelegramId,
              adminId: adminTelegramId,
              hasAccess: currentUserTelegramId === adminTelegramId
            });

            if (currentUserTelegramId === adminTelegramId) {
              setIsAdmin(true);

              // Load admin data
              await loadAdminData();
            } else {
              setAccessDenied(true);
            }
          } else {
            console.log('Admin Auth - No user data from Telegram');
            setAccessDenied(true);
          }
        } else {
          console.log('Admin Auth - Not running in Telegram');
          setAccessDenied(true);
        }
      } catch (e) {
        console.error('Admin Auth - Failed to initialize Telegram Web App:', e);
        setAccessDenied(true);
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    initAdminCheck();
  }, []);

  // Load admin dashboard data
  const loadAdminData = async () => {
    setDataLoading(true);
    try {
      // Load analytics stats
      const statsResponse = await fetch('/api/admin/analytics');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load withdrawals
      const withdrawalsResponse = await fetch('/api/admin/withdrawals');
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawals(withdrawalsData.withdrawals || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Handle withdrawal click
  const handleWithdrawalClick = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowModal(true);
  };

  // Handle status update (Approve/Reject)
  const handleStatusUpdate = async (withdrawalId: string, status: 'COMPLETED' | 'FAILED') => {
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId,
          status,
        }),
      });

      if (response.ok) {
        alert(`Withdrawal ${status === 'COMPLETED' ? 'approved' : 'rejected'} successfully!`);
        // Refresh the data
        await loadAdminData();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Failed to update withdrawal status');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Verifying Admin Access...</h2>
          <p className="text-gray-400">Checking Telegram authentication</p>
        </div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold mb-4 text-red-400">Access Restricted</h1>
          <p className="text-lg text-gray-300 mb-2">
            This admin panel requires administrator privileges.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Current User ID: <span className="font-mono">{userTelegramId || 'Unknown'}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Return to App
          </button>
        </div>
      </div>
    );
  }

  // Not in Telegram state
  if (!isInitialized && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold mb-4 text-yellow-400">Telegram Required</h1>
          <p className="text-lg text-gray-300 mb-6">
            The admin panel must be accessed through Telegram.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Main App
          </button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            🏆 Admin Dashboard
          </h1>
          <p className="text-gray-300">
            Withdrawal Analytics & Management
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Total Withdrawals</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              ₦{stats.total.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm">All time withdrawals</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Last 24 Hours</h3>
              <span className="text-2xl">⏰</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              ₦{stats.last24Hours.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm">Past 24 hours</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">This Month</h3>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              ₦{stats.thisMonth.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm">Current month</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Last 3 Months</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              ₦{stats.last3Months.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm">Quarterly total</p>
          </div>
        </div>

        {/* Withdrawals Management */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white mb-2">Withdrawal Requests</h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-300">
                Manage and process withdrawal requests
              </p>
              <button
                onClick={loadAdminData}
                disabled={dataLoading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {dataLoading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="font-mono">...{withdrawal.userId.slice(-6)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-400">
                      ₦{withdrawal.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleWithdrawalClick(withdrawal)}
                        className={`px-3 py-1 text-xs rounded-full font-semibold capitalize ${
                          withdrawal.withdrawMethod === 'bank'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {withdrawal.withdrawMethod === 'bank' ? '🏦 ' : '💎 '}{withdrawal.withdrawMethod}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        withdrawal.status === 'PENDING'
                          ? 'bg-yellow-600 text-white'
                          : withdrawal.status === 'COMPLETED'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(withdrawal.id, 'COMPLETED')}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(withdrawal.id, 'FAILED')}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        ❌ Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Withdrawal Details Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Withdrawal Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                  selectedWithdrawal.status === 'PENDING' ? 'bg-yellow-600' :
                  selectedWithdrawal.status === 'COMPLETED' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {selectedWithdrawal.status}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Amount:</span>
                <span className="text-yellow-400 font-bold">
                  ₦{selectedWithdrawal.amount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Method:</span>
                <span className="text-white capitalize">{selectedWithdrawal.withdrawMethod}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Date Requested:</span>
                <span className="text-gray-300 text-sm">
                  {new Date(selectedWithdrawal.createdAt).toLocaleString()}
                </span>
              </div>

              <hr className="border-gray-600 my-4" />

              {/* Dynamic content based on withdrawal method */}
              {selectedWithdrawal.withdrawMethod === 'bank' ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Bank Name:</span>
                    <span className="text-white">{selectedWithdrawal.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Account Number:</span>
                    <span className="text-white font-mono">{selectedWithdrawal.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Account Name:</span>
                    <span className="text-white">{selectedWithdrawal.accountName}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">TON Address:</span>
                    <span className="text-purple-400 font-mono text-sm break-all">
                      {selectedWithdrawal.tonAddress}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'COMPLETED')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'FAILED')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
