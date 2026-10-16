import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Fixed, slowly drifting aurora lights behind the whole app. */
export function AuroraBackground({ intensity = 'normal' }) {
  const strong = intensity === 'strong';
  return (
    <div aria-hidden className="aurora-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-navy-900">
      <div className={`absolute -top-[20%] -left-[10%] h-[60vmax] w-[60vmax] rounded-full blur-[120px] animate-aurora ${strong ? 'bg-brand-600/35' : 'bg-brand-600/20'}`} />
      <div className={`absolute top-[10%] -right-[15%] h-[50vmax] w-[50vmax] rounded-full blur-[130px] animate-aurora-slow ${strong ? 'bg-cyan-500/25' : 'bg-cyan-500/[0.12]'}`} />
      <div className={`absolute -bottom-[25%] left-[20%] h-[55vmax] w-[55vmax] rounded-full blur-[140px] animate-aurora ${strong ? 'bg-emerald-500/[0.18]' : 'bg-emerald-500/[0.08]'}`} />
      <div className="absolute inset-0 bg-grid mask-radial opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-950/70" />
    </div>
  );
}

/** SmartSpend logo mark: a gradient tile with a rising line. */
export function Logo({ size = 36, withText = true, subtitle }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative flex-shrink-0 rounded-[30%] bg-gradient-to-br from-brand-400 via-brand-500 to-cyan-400 p-[1.5px] shadow-glow" style={{ width: size, height: size }}>
        <div className="flex h-full w-full items-center justify-center rounded-[28%] bg-gradient-to-br from-brand-500 to-cyan-500">
          <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5.5-5.5 4 4L21 7" />
            <path d="M15 7h6v6" />
          </svg>
        </div>
      </div>
      {withText && (
        <div className="min-w-0 leading-tight">
          <p className="font-display text-[1.05rem] font-extrabold tracking-tight text-white">Smart<span className="text-gradient">Spend</span></p>
          {subtitle && <p className="truncate text-xs text-white/40">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

/** Consistent page title with an optional kicker, subtitle and actions. */
export function PageHeader({ kicker, title, subtitle, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-rise">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h1 className="font-display text-[1.75rem] font-extrabold leading-tight tracking-tight text-white sm:text-[2rem] flex items-center gap-3 flex-wrap">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-white/45">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}

/** Centred glass dialog with a blurred backdrop. */
export function Modal({ title, icon: Icon, onClose, children, width = 'max-w-md' }) {
  // Close with the Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-md animate-[rise_.2s_ease_both]" onClick={onClose} />
      <div className={`relative w-full ${width} glass-strong glow-border max-h-[92vh] overflow-y-auto p-6 sm:p-7 animate-pop`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-cyan-500/20 text-brand-200 ring-1 ring-inset ring-white/10">
                <Icon size={18} />
              </div>
            )}
            <h2 className="font-display text-xl font-bold tracking-tight text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Inline error box used inside forms. */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <p className="mb-4 rounded-2xl border border-coral-500/25 bg-coral-500/10 px-4 py-3 text-sm text-coral-300 animate-pop">{children}</p>
  );
}

/** Empty state block. */
export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-white/40 ring-1 ring-inset ring-white/10">
          <Icon size={24} />
        </div>
      )}
      <p className="font-semibold text-white/80">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-white/40">{children}</p>}
    </div>
  );
}

/** Shimmering placeholder while data loads. */
export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.04] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}
