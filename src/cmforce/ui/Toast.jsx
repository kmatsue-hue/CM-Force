import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const styles = {
  error:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-900',     iconCls: 'text-red-600',     Icon: AlertCircle },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', iconCls: 'text-emerald-600', Icon: CheckCircle2 },
  info:    { bg: 'bg-white',      border: 'border-gray-200',    text: 'text-gray-900',    iconCls: 'text-gray-500',    Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none w-[min(92vw,420px)]">
        {toasts.map((t) => {
          const s = styles[t.type] ?? styles.info;
          const Icon = s.Icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl shadow-lg border p-4 flex items-start gap-3 ${s.bg} ${s.border} ${s.text} animate-in fade-in slide-in-from-top-2 duration-200`}
              role="alert"
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${s.iconCls}`} />
              <div className="flex-1 text-sm whitespace-pre-line leading-relaxed">{t.message}</div>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-gray-400 hover:text-gray-700"
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // ToastProvider 未配置でもクラッシュさせず、コンソールに警告だけ出す保険
    return {
      showToast: (msg) => { /* eslint-disable-next-line no-console */ console.warn('[Toast]', msg); },
      dismissToast: () => {},
    };
  }
  return ctx;
}
