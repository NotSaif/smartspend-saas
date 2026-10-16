import { useState, useRef } from 'react';
import { X, Plus, Save, ScanLine, Loader2, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PAYMENT_METHODS, todayISO } from '../data/constants';
import { receiptsAPI } from '../services/api';

export default function TransactionModal({ transaction, onClose }) {
  const { categories, saveTransaction } = useApp();
  const isEdit = Boolean(transaction);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => transaction ? {
    amount: transaction.amount, date: transaction.date, type: transaction.type,
    categoryId: transaction.categoryId ?? '', description: transaction.description,
    paymentMethod: transaction.paymentMethod, receiptUrl: transaction.receiptUrl,
  } : {
    amount: '', date: todayISO(), type: 'expense', categoryId: '',
    description: '', paymentMethod: 'transfer', receiptUrl: null,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState('');

  const availableCats = categories.filter(c => c.type === form.type);
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date || !form.categoryId || !form.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (Number(form.amount) <= 0) { setError('Amount must be greater than zero.'); return; }
    if (form.date > todayISO()) { setError('The date cannot be in the future.'); return; }
    setSaving(true);
    const err = await saveTransaction(transaction?.id, {
      ...form, amount: parseFloat(form.amount), categoryId: parseInt(form.categoryId), description: form.description.trim(),
    });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  };

  // ── Receipt OCR ───────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOcrLoading(true); setOcrError(''); setOcrResult(null);
    try {
      const { data } = await receiptsAPI.ocr(file);
      setOcrResult(data);
      setForm(prev => ({
        ...prev,
        type: 'expense',
        categoryId: prev.type === 'expense' ? prev.categoryId : '',
        ...(data.amount ? { amount: data.amount.toFixed(3) } : {}),
        ...(data.date && data.date <= todayISO() ? { date: data.date } : {}),
        ...(data.vendor && data.vendor !== 'Unknown Vendor' ? { description: data.vendor } : {}),
      }));
    } catch (err) {
      setOcrError(err.message || 'Could not read the receipt.');
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-lg p-6 animate-fadeIn max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors" aria-label="Close"><X size={20} /></button>
        </div>

        {/* Receipt scanner */}
        <div className="mb-5 p-4 rounded-xl border border-dashed border-white/15 bg-white/3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ScanLine size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Scan Receipt</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold uppercase tracking-wide">OCR</span>
            </div>
            <button type="button" disabled={ocrLoading} onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 transition-colors disabled:opacity-50">
              {ocrLoading ? <><Loader2 size={12} className="animate-spin" /> Scanning…</> : <><Paperclip size={12} /> Upload Image</>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" className="hidden" onChange={handleFileSelect} />
          </div>
          {ocrError && <div className="flex items-center gap-2 mt-2 text-xs text-coral-400"><AlertCircle size={12} /> {ocrError}</div>}
          {ocrResult && !ocrError && (
            <div className="flex items-start gap-2 mt-2">
              <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50 leading-relaxed">
                Extracted —{' '}
                {ocrResult.vendor !== 'Unknown Vendor' && <span className="text-white/70">{ocrResult.vendor}</span>}
                {ocrResult.amount && <span className="text-white/70"> · BHD {ocrResult.amount.toFixed(3)}</span>}
                {ocrResult.date && <span className="text-white/70"> · {ocrResult.date}</span>}
                <span className="block mt-0.5 text-white/30">Fields pre-filled below — choose a category and review before saving.</span>
              </p>
            </div>
          )}
          {!ocrResult && !ocrError && !ocrLoading && (
            <p className="text-xs text-white/30 mt-1">Upload a photo of a receipt (JPEG or PNG, max 5 MB) to fill in the amount, date and vendor.</p>
          )}
        </div>

        {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 p-1 bg-navy-700 rounded-xl">
            {['expense', 'income'].map(t => (
              <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  form.type === t ? (t === 'expense' ? 'bg-coral-500 text-white' : 'bg-emerald-500 text-white') : 'text-white/40 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Amount (BHD) *</label>
              <input name="amount" type="number" step="0.001" min="0.001" value={form.amount} onChange={handleChange} placeholder="0.000" className="input-field" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Date *</label>
              <input name="date" type="date" max={todayISO()} value={form.date} onChange={handleChange} className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Category *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
              <option value="">Select {form.type} category…</option>
              {availableCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Payment Method *</label>
            <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="input-field">
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Description *</label>
            <input name="description" type="text" maxLength={200} value={form.description} onChange={handleChange}
              placeholder="e.g. Monthly payroll" className="input-field" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
              {isEdit ? <Save size={16} /> : <Plus size={16} />}
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
