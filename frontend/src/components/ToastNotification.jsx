import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { AlertCircle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

export default function ToastNotification() {
  const { toast } = useApp();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />;
      case 'error': return <ShieldAlert size={18} style={{ color: 'var(--color-error)' }} />;
      case 'warning': return <AlertCircle size={18} style={{ color: 'var(--color-warning)' }} />;
      default: return <Info size={18} style={{ color: 'var(--color-accent)' }} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success': return 'var(--color-success)';
      case 'error': return 'var(--color-error)';
      case 'warning': return 'var(--color-warning)';
      default: return 'var(--color-accent)';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999,
        borderLeft: `4px solid ${getBorderColor()}`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      {getIcon()}
      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#ffffff' }}>
        {toast.message}
      </span>
    </div>
  );
}
