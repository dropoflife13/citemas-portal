'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const MAX_TOASTS = 3;

const TOAST_STYLES = {
  success: {
    border: 'border-emerald-600/35 dark:border-emerald-500/40',
    bg: 'bg-emerald-50/95 dark:bg-emerald-950/85',
    icon: <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
    text: 'text-emerald-950 dark:text-emerald-100',
  },
  error: {
    border: 'border-red-600/35 dark:border-red-500/40',
    bg: 'bg-red-50/95 dark:bg-red-950/85',
    icon: <XCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />,
    text: 'text-red-950 dark:text-red-100',
  },
  info: {
    border: 'border-amber-600/35 dark:border-amber-500/40',
    bg: 'bg-amber-50/95 dark:bg-amber-950/85',
    icon: <Info size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />,
    text: 'text-amber-950 dark:text-amber-100',
  },
};

function ToastItem({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  const isError = toast.type === 'error';
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isError || paused) return;
    const ms = Math.max(5000, toast.duration || 5000);
    timerRef.current = setTimeout(() => onDismiss(toast.id), ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isError, paused, toast.id, toast.duration, onDismiss]);

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border ${style.border} ${style.bg} px-4 py-3 backdrop-blur-xl`}
      style={{ animation: 'toastIn 0.3s ease-out' }}
    >
      {style.icon}
      <p className={`flex-1 text-xs font-medium leading-relaxed ${style.text}`}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-600 dark:text-white/60 transition-colors hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, message, type, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating notification stack (max 3 visible) */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex w-80 flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>

      <style jsx global>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes toastIn {
            from { opacity: 1; transform: none; }
            to { opacity: 1; transform: none; }
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
