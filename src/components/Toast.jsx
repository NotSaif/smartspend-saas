import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

let toastListeners = [];
// eslint-disable-next-line react-refresh/only-export-components
export const toast = {
  success: (msg) => toastListeners.forEach(fn => fn({ type: 'success', msg })),
  warning: (msg) => toastListeners.forEach(fn => fn({ type: 'warning', msg })),
  error:   (msg) => toastListeners.forEach(fn => fn({ type: 'error',   msg })),
};

const styles = {
  success: { icon: CheckCircle2, ring: 'text-emerald-400 bg-emerald-500/15', bar: 'from-emerald-400 to-cyan-400' },
  warning: { icon: AlertTriangle, ring: 'text-amber-400 bg-amber-500/15', bar: 'from-amber-400 to-coral-400' },
  error:   { icon: XCircle, ring: 'text-coral-400 bg-coral-500/15', bar: 'from-coral-400 to-coral-500' },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      const id = Date.now() + Math.random();
      setToasts(p => [...p, { ...t, id }]);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4500);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler); };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2.5" role="status" aria-live="polite">
      {toasts.map(t => {
        const s = styles[t.type];
        const Icon = s.icon;
        return (
          <div key={t.id} className="glass-strong pointer-events-auto flex min-w-[300px] max-w-sm items-center gap-3 overflow-hidden !rounded-2xl px-4 py-3.5 animate-slideIn">
            <span className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${s.bar}`} />
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${s.ring}`}><Icon size={16} /></span>
            <span className="flex-1 text-sm font-medium text-white">{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-white/40 transition-colors hover:text-white" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
