import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Orders from './Orders';

const OrdersPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <div style={{ 
        background: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <button
          onClick={() => navigate('/company-dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#64748b',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <div style={{ height: 24, width: 1, background: '#e2e8f0' }} />
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1e293b' }}>
          Order Management
        </h1>
      </div>

      {/* Orders Component */}
      <div style={{ padding: 24 }}>
        <Orders />
      </div>
    </div>
  );
};

export default OrdersPage;
