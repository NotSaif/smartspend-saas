import { Trash2 } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-md" onClick={onCancel} />
      <div className="glass-strong relative w-full max-w-sm p-7 text-center animate-pop">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-500/15 text-coral-400 ring-1 ring-inset ring-coral-500/30 shadow-[0_0_40px_-8px_rgba(244,63,94,0.6)]">
          <Trash2 size={24} />
        </div>
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        <p className="mb-6 mt-1.5 text-sm text-white/55">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
