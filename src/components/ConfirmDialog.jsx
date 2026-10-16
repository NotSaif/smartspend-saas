import { Trash2 } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card p-6 w-full max-w-sm text-center animate-fadeIn">
        <Trash2 size={32} className="text-coral-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-white/50 text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
