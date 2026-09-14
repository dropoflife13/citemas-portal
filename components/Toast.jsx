'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
    text: 'text-emerald-200',
  },
  error: {
    border: 'border-red-500/40',
    bg: 'bg-red-500/10',
    icon: <XCircle size={18} className="text-red-400 shrink-0" />,
    text: 'text-red-200',
  },
  info: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    icon: <Info size={18} className="text-amber-400 shrink-0" />,
    text: 'text-amber-200',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating notification stack */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex w-80 flex-col gap-3">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${style.border} ${style.bg} px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-[slideIn_0.3s_ease-out]`}
              style={{ animation: 'toastIn 0.3s ease-out' }}
            >
              {style.icon}
              <p className={`flex-1 text-xs font-medium leading-relaxed ${style.text}`}>{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-white/40 transition-colors hover:text-white/80"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}