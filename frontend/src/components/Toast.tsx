import React, { useEffect } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          icon: '✓'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          icon: '✕'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          icon: 'ℹ'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      style={{
        background: styles.background,
        color: 'white',
        padding: '14px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '500px',
        animation: 'slideDown 0.3s ease-out',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          flexShrink: 0
        }}
      >
        {styles.icon}
      </div>
      <p style={{ margin: 0, fontSize: '15px', fontWeight: '500', flex: 1 }}>
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s',
          fontSize: '18px'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        ×
      </button>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          animation: `shrink ${duration}ms linear`,
          width: '100%',
          transformOrigin: 'left'
        }}
      />
    </div>
  );
};

export default Toast;