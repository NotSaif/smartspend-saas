import { useState, useRef } from 'react';
import { Plus, Save, ScanLine, Loader2, CheckCircle2, AlertCircle, Paperclip, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PAYMENT_METHODS, todayISO } from '../data/constants';
import { receiptsAPI } from '../services/api';
import { Modal, FormError } from './ui';

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
    <Modal title={isEdit ? 'Edit Transaction' : 'Add Transaction'} icon={ArrowLeftRight} onClose={onClose} width="max-w-lg">
      {/* Receipt scanner */}
      <div className={`mb-5 rounded-2xl border border-dashed p-4 transition-colors ${ocrLoading ? 'border-cyan-400/50 bg-cyan-500/[0.06]' : 'border-white/15 bg-white/[0.03]'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><ScanLine size={16} /></span>
            <span className="text-sm font-semibold text-white">Scan Receipt</span>
            <span className="rounded-md bg-gradient-to-r from-brand-500/30 to-cyan-500/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/80">OCR</span>
          </div>
          <button type="button" disabled={ocrLoading} onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-200 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.1] disabled:opacity-50">
            {ocrLoading ? <><Loader2 size={12} className="animate-spin" /> Scanning…</> : <><Paperclip size={12} /> Upload Image</>}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/bmp" className="hidden" onChange={handleFileSelect} />
        </div>
        {ocrError && <div className="mt-3 flex items-center gap-2 text-xs text-coral-300"><AlertCircle size={13} /> {ocrError}</div>}
        {ocrResult && !ocrError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/[0.08] p-2.5 ring-1 ring-inset ring-emerald-400/20 animate-pop">
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-white/55">
              Extracted —{' '}
              {ocrResult.vendor !== 'Unknown Vendor' && <span className="font-semibold text-white/85">{ocrResult.vendor}</span>}
              {ocrResult.amount && <span className="font-semibold text-white/85"> · BHD {ocrResult.amount.toFixed(3)}</span>}
              {ocrResult.date && <span className="font-semibold text-white/85"> · {ocrResult.date}</span>}
              <span className="mt-0.5 block text-white/40">Fields pre-filled below — choose a category and review before saving.</span>
            </p>
          </div>
        )}
        {!ocrResult && !ocrError && !ocrLoading && (
          <p className="mt-2 text-xs text-white/35">Upload a photo of a receipt (JPEG or PNG, max 5 MB) to fill in the amount, date and vendor.</p>
        )}
      </div>

      <FormError>{error}</FormError>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative grid grid-cols-2 rounded-2xl bg-navy-950/60 p-1 ring-1 ring-inset ring-white/[0.08]">
          {['expense', 'income'].map(t => (
            <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
              className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition-all duration-300 ${
                form.type === t
                  ? (t === 'expense' ? 'bg-gradient-to-r from-coral-500 to-[#E11D48] text-white shadow-[0_6px_20px_-6px_rgba(244,63,94,0.8)]' : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_6px_20px_-6px_rgba(16,185,129,0.8)]')
                  : 'text-white/45 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Amount (BHD) *</label>
            <input name="amount" type="number" step="0.001" min="0.001" value={form.amount} onChange={handleChange} placeholder="0.000" className="input-field num" />
          </div>
          <div>
            <label className="label">Date *</label>
            <input name="date" type="date" max={todayISO()} value={form.date} onChange={handleChange} className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Category *</label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
            <option value="">Select {form.type} category…</option>
            {availableCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Payment Method *</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="input-field">
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Description *</label>
          <input name="description" type="text" maxLength={200} value={form.description} onChange={handleChange}
            placeholder="e.g. Monthly payroll" className="input-field" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {isEdit ? <Save size={16} /> : <Plus size={16} />}
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
