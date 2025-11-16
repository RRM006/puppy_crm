import React from 'react';

const backdropStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1000
};
const panelStyle = {
  background: '#ffffff', 
  borderRadius: 12, 
  padding: 24, 
  width: 'min(96vw, 640px)', 
  maxHeight: '90vh',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#0f172a' }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{ 
              border: 'none', 
              background: 'transparent', 
              fontSize: 24, 
              cursor: 'pointer',
              color: '#64748b',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
        {footer && (
          <div style={{ marginTop: 16, flexShrink: 0 }}>{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
