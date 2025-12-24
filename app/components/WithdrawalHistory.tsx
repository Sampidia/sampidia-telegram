'use client';

interface Withdrawal {
  id: string;
  amount: number;
  withdrawMethod: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  tonAddress?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
}

interface WithdrawalHistoryProps {
  withdrawals: Withdrawal[];
  isLoading?: boolean;
  onRetry?: () => void;
  error?: string | null;
}

export default function WithdrawalHistory({
  withdrawals,
  isLoading = false,
  onRetry,
  error
}: WithdrawalHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodDisplay = (withdrawal: Withdrawal) => {
    if (withdrawal.withdrawMethod === 'bank') {
      return `${withdrawal.bankName} - ${withdrawal.accountName}`;
    } else if (withdrawal.withdrawMethod === 'ton') {
      return `TON Wallet - ${withdrawal.tonAddress?.slice(0, 8)}...${withdrawal.tonAddress?.slice(-6)}`;
    }
    return withdrawal.withdrawMethod;
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Withdrawal History</h2>
      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading withdrawal history...</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 underline"
            >
              Retry
            </button>
          )}
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500 mb-3">Failed to load withdrawal history</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-3">No withdrawals yet. Make a withdrawal to see it here!</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Withdrawals
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-500">{withdrawals.length} withdrawal(s)</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm text-blue-500 hover:text-blue-600 underline"
              >
                Refresh
              </button>
            )}
          </div>
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {withdrawal.amount.toLocaleString()} ⭐
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Method: {getMethodDisplay(withdrawal)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested: {formatDate(withdrawal.createdAt)}
                    </p>
                    {withdrawal.processedAt && (
                      <p className="text-xs text-gray-500">
                        Processed: {formatDate(withdrawal.processedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}