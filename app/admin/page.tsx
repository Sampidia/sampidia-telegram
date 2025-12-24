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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Dashboard state
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

  // Check authentication on page load
  useEffect(() => {
    // Check if user is already authenticated in localStorage
    const isAuth = localStorage.getItem('admin_auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadAdminData();
    } else {
      setShowLoginForm(true);
    }
    setIsLoading(false);
  }, []);

  // Handle password authentication
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get password from environment variable
    const adminPassword = process.env.NEXT_PUBLIC_NEXT_ADMIN;

    if (!adminPassword) {
      setError('Admin password not configured. Please check environment variables.');
      return;
    }

    if (password === adminPassword) {
      // Authentication successful
      setIsAuthenticated(true);
      setShowLoginForm(false);
      setPassword('');
      setError('');
      localStorage.setItem('admin_auth', 'true');

      // Load admin data
      loadAdminData();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLoginForm(true);
    localStorage.removeItem('admin_auth');
    setPassword('');
    setError('');
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  // Load admin dashboard data
  const loadAdminData = async () => {
    setDataLoading(true);
    try {
      // Load analytics stats
      const statsResponse = await fetch('/api/admin/analytics');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.error('Analytics API error:', await statsResponse.text());
      }

      // Load withdrawals
      const withdrawalsResponse = await fetch('/api/admin/withdrawals');
      if (withdrawalsResponse.ok) {
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawals(withdrawalsData.withdrawals || []);
      } else {
        console.error('Withdrawals API error:', await withdrawalsResponse.text());
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
  const handleStatusUpdate = async (withdrawalId: string, status: 'PENDING' | 'COMPLETED' | 'FAILED') => {
    try {
      const response = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId,
          status,
          telegramId: process.env.NEXT_PUBLIC_NEXT_ADMIN,
        }),
      });

      if (response.ok) {
        alert(`Withdrawal ${status === 'COMPLETED' ? 'approved' : status === 'PENDING' ? 'set to pending' : 'rejected'} successfully!`);
        // Refresh the data
        await loadAdminData();
        setShowModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch {
      alert('Failed to update withdrawal status');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Admin Panel...</h2>
          <p className="text-gray-400">Checking authentication</p>
        </div>
      </div>
    );
  }

  // Password login form
  if (showLoginForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md mx-4 border border-gray-700">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">Admin Access</h1>
            <p className="text-gray-300">Enter the admin password to continue</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Admin Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter admin password..."
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-600 border border-red-500 rounded-lg">
                <p className="text-red-100 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Access Admin Panel
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to Main App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              🏆 Admin Dashboard
            </h1>
            <p className="text-gray-300">
              Withdrawal Analytics & Management
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Total Stars</h3>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {stats.total.toLocaleString()} ⭐
            </div>
            <p className="text-gray-400 text-sm">${(stats.total * 0.009).toFixed(2)} USD</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Last 24 Hours</h3>
              <span className="text-2xl">⏰</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats.last24Hours.toLocaleString()} ⭐
            </div>
            <p className="text-gray-400 text-sm">${(stats.last24Hours * 0.009).toFixed(2)} USD</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">This Month</h3>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {stats.thisMonth.toLocaleString()} ⭐
            </div>
            <p className="text-gray-400 text-sm">${(stats.thisMonth * 0.009).toFixed(2)} USD</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Last 3 Months</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {stats.last3Months.toLocaleString()} ⭐
            </div>
            <p className="text-gray-400 text-sm">${(stats.last3Months * 0.009).toFixed(2)} USD</p>
          </div>
        </div>

        {/* Profits Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Total Profits</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${(stats.total * 0.004).toFixed(2)}
            </div>
            <p className="text-gray-400 text-sm">
              {stats.total.toLocaleString()} ⭐ × 0.4%
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">24H Profits</h3>
              <span className="text-2xl">⏰</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${(stats.last24Hours * 0.004).toFixed(2)}
            </div>
            <p className="text-gray-400 text-sm">
              {stats.last24Hours.toLocaleString()} ⭐ × 0.4%
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">Monthly Profits</h3>
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${(stats.thisMonth * 0.004).toFixed(2)}
            </div>
            <p className="text-gray-400 text-sm">
              {stats.thisMonth.toLocaleString()} ⭐ × 0.4%
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-300">3M Profits</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              ${(stats.last3Months * 0.004).toFixed(2)}
            </div>
            <p className="text-gray-400 text-sm">
              {stats.last3Months.toLocaleString()} ⭐ × 0.4%
            </p>
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
                      {withdrawal.amount.toLocaleString()} ⭐
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleWithdrawalClick(withdrawal)}
                        className={`px-3 py-1 text-xs rounded-full font-semibold capitalize ${withdrawal.withdrawMethod === 'bank'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                      >
                        {withdrawal.withdrawMethod === 'bank' ? '🏦 ' : '💎 '}{withdrawal.withdrawMethod}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${withdrawal.status === 'PENDING'
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
                        onClick={() => handleStatusUpdate(withdrawal.id, 'PENDING')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        🔄 Pend
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(withdrawal.id, 'FAILED')}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        ❌ Fail
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
                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${selectedWithdrawal.status === 'PENDING' ? 'bg-yellow-600' :
                    selectedWithdrawal.status === 'COMPLETED' ? 'bg-green-600' : 'bg-red-600'
                  }`}>
                  {selectedWithdrawal.status}
                </span>
              </div>

              <div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-yellow-400 font-bold">
                    {selectedWithdrawal.amount.toLocaleString()} ⭐
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400 text-sm">USD Value:</span>
                  <span className="text-yellow-300 text-sm">
                    ${(selectedWithdrawal.amount * 0.009).toFixed(2)}
                  </span>
                </div>
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
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'PENDING')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  🔄 Set to Pending
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'FAILED')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                >
                  ❌ Mark as Failed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
