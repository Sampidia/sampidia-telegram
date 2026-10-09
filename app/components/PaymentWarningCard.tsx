import React from 'react';

export const PaymentWarningCard: React.FC = () => {
  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '12px 16px',
        backgroundColor: '#2d1a00',
        border: '1px solid #d97706',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }} role="img" aria-label="warning">
        ⚠️
      </span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: '#fbbf24',
            marginBottom: '4px',
          }}
        >
          Important Payment Processing Notice
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            color: '#fde68a',
            lineHeight: '1.5',
          }}
        >
          Payments are processed on the{' '}
          <strong style={{ color: '#fcd34d', textDecoration: 'underline' }}>22nd day</strong>{' '}
          after star deposit to prevent refund fraud.
        </p>
      </div>
    </div>
  );
};
