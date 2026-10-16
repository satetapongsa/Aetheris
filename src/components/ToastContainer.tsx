import React from 'react';
import type { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(toast => {
        let iconColor = 'text-primary';
        if (toast.type === 'success') iconColor = 'text-success';
        if (toast.type === 'error') iconColor = 'text-error';

        return (
          <div key={toast.id} className="toast">
            <span className={`material-symbols-outlined ${iconColor}`}>
              {toast.icon || 'info'}
            </span>
            <span>{toast.text}</span>
          </div>
        );
      })}
    </div>
  );
};
