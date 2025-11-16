import React from 'react';
import { FiCalendar, FiDollarSign, FiUser } from 'react-icons/fi';

const PRIORITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444'
};

const DealCard = ({ deal, onClick }) => {
  const isOverdue = deal.is_overdue && deal.status === 'open';
  const priorityColor = PRIORITY_COLORS[deal.priority] || '#64748b';
  const initials = deal.assigned_to 
    ? `${(deal.assigned_to.first_name || '').charAt(0)}${(deal.assigned_to.last_name || '').charAt(0)}`.toUpperCase()
    : 'U';

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        cursor: 'pointer',
        border: `1px solid #e2e8f0`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Priority Indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: priorityColor
        }}
      />

      {/* Overdue Badge */}
      {isOverdue && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#ef4444',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 4
          }}
        >
          Overdue
        </div>
      )}

      {/* Deal Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#0f172a',
          marginBottom: 8,
          paddingRight: isOverdue ? 60 : 0
        }}
      >
        {deal.title}
      </div>

      {/* Company Name */}
      {deal.company_name && (
        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <FiUser size={12} />
          {deal.company_name}
        </div>
      )}

      {/* Value */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#10b981',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <FiDollarSign size={14} />
        {formatCurrency(deal.value, deal.currency)}
      </div>

      {/* Expected Close Date */}
      {deal.expected_close_date && (
        <div
          style={{
            fontSize: 11,
            color: isOverdue ? '#ef4444' : '#64748b',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: isOverdue ? 600 : 400
          }}
        >
          <FiCalendar size={12} />
          {formatDate(deal.expected_close_date)}
        </div>
      )}

      {/* Assigned User */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid #f1f5f9'
        }}
      >
        {deal.assigned_to ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#4c6fff',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 600
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {deal.assigned_to.first_name} {deal.assigned_to.last_name}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
        )}
        {deal.probability !== undefined && (
          <span
            style={{
              fontSize: 11,
              color: '#64748b',
              background: '#f1f5f9',
              padding: '2px 6px',
              borderRadius: 4,
              fontWeight: 500
            }}
          >
            {deal.probability}%
          </span>
        )}
      </div>
    </div>
  );
};

export default DealCard;

