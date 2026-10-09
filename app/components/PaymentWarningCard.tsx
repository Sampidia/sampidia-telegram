import React from 'react';

export const PaymentWarningCard: React.FC = () => {
  return (
    <div className="mb-4 p-4 bg-amber-950/60 border border-amber-500/40 rounded-lg text-amber-200 shadow-md">
      <div className="flex items-start space-x-3">
        <span className="text-xl flex-shrink-0 mt-0.5" role="img" aria-label="warning">⚠️</span>
        <div>
          <h3 className="text-sm font-semibold text-amber-400 mb-1">
            Important Payment Processing Notice
          </h3>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Payments are processed on the <strong className="text-amber-300 underline underline-offset-2">22nd day</strong> after star deposit to prevent refund fraud.
          </p>
        </div>
      </div>
    </div>
  );
};
