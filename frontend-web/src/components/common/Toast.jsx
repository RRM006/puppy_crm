import React, { useEffect } from 'react';

const toastBase = {
  position: 'fixed', right: 16, bottom: 16, zIndex: 1100,
  display: 'grid', gap: 8, maxWidth: 360
};

const itemStyle = (type) => ({
  background: type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#e0f2fe',
  color: '#0f172a', padding: '10px 12px', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
});

export const ToastItem = ({ id, message, type = 'info', onClose, timeout = 3000 }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose?.(id), timeout);
    return () => clearTimeout(t);
  }, [id, onClose, timeout]);
  return (
    <div style={itemStyle(type)}>
      {message}
    </div>
  );
};

const Toast = ({ toasts = [], remove }) => {
  return (
    <div style={toastBase}>
      {toasts.map(t => (
        <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onClose={remove} timeout={t.timeout} />
      ))}
    </div>
  );
};

export default Toast;
