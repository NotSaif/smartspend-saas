import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

let toastListeners = [];
export const toast = {
  success: (msg) => toastListeners.forEach(fn => fn({ type: 'success', msg })),
  warning: (msg) => toastListeners.forEach(fn => fn({ type: 'warning', msg })),
  error:   (msg) => toastListeners.forEach(fn => fn({ type: 'error',   msg })),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      const id = Date.now();
      setToasts(p => [...p, { ...t, id }]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler); };
  }, []);

  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    error:   'border-coral-500/30 bg-coral-500/10 text-coral-400',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border glass-card min-w-[280px] max-w-sm pointer-events-auto animate-slideIn ${styles[t.type]}`}
        >
          {t.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium text-white flex-1">{t.msg}</span>
          <button
            onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
