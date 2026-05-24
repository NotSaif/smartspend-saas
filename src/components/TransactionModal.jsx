import { useState, useEffect, useRef } from 'react';
import { X, Plus, ScanLine, Loader2, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PAYMENT_METHODS } from '../data/mockData';
import { receiptsAPI } from '../services/api';

export default function TransactionModal({ transaction, onClose }) {
  const { categories, addTransaction, updateTransaction } = useApp();
  const { currentUser } = useAuth();
  const isEdit = Boolean(transaction);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    categoryId: '',
    description: '',
    paymentMethod: 'transfer',
    receiptUrl: null,
  });
  const [error, setError] = useState('');

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult]   = useState(null); // { vendor, amount, date } | null
  const [ocrError, setOcrError]     = useState('');

  useEffect(() => {
    if (transaction) {
      setForm({
        amount:        transaction.amount,
        date:          transaction.date,
        type:          transaction.type,
        categoryId:    transaction.categoryId,
        description:   transaction.description,
        paymentMethod: transaction.paymentMethod,
        receiptUrl:    transaction.receiptUrl || null,
      });
    }
  }, [transaction]);

  const availableCats = categories.filter(c => c.type === form.type);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      [name]: value,
      ...(name === 'type' ? { categoryId: '' } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.date || !form.categoryId || !form.description) {
      setError('Please fill in all required fields.');
      return;
    }
    const payload = {
      ...form,
      amount:     parseFloat(form.amount),
      categoryId: parseInt(form.categoryId),
      companyId:  currentUser?.companyId || 1,
      userId:     currentUser?.id || 1,
    };
    if (isEdit) updateTransaction(transaction.id, payload);
    else addTransaction(payload);
    onClose();
  };

  // ── Receipt OCR ───────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError('');
    setOcrResult(null);

    try {
      const res = await receiptsAPI.ocr(file);
      const { vendor, amount, date } = res.data;
      setOcrResult(res.data);

      // Pre-fill form fields if values were extracted
      setForm(prev => ({
        ...prev,
        ...(amount  ? { amount: amount.toFixed(3) } : {}),
        ...(date    ? { date }                       : {}),
        ...(vendor && vendor !== 'Unknown Vendor' ? { description: vendor } : {}),
      }));
    } catch (err) {
      setOcrError(err.message || 'Could not read receipt.');
    } finally {
      setOcrLoading(false);
      // Reset file input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-lg p-6 animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* ── Receipt Scanner ───────────────────────────────── */}
        <div className="mb-5 p-4 rounded-xl border border-dashed border-white/15 bg-white/3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ScanLine size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-white">Scan Receipt</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold uppercase tracking-wide">OCR</span>
            </div>
            <button
              type="button"
              disabled={ocrLoading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 transition-colors disabled:opacity-50"
            >
              {ocrLoading
                ? <><Loader2 size={12} className="animate-spin" /> Scanning…</>
                : <><Paperclip size={12} /> Upload Image</>
              }
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* OCR feedback */}
          {ocrError && (
            <div className="flex items-center gap-2 mt-2 text-xs text-coral-400">
              <AlertCircle size={12} /> {ocrError}
            </div>
          )}
          {ocrResult && !ocrError && (
            <div className="flex items-start gap-2 mt-2">
              <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/50 leading-relaxed">
                Extracted —{' '}
                {ocrResult.vendor && ocrResult.vendor !== 'Unknown Vendor' && <span className="text-white/70">{ocrResult.vendor}</span>}
                {ocrResult.amount && <span className="text-white/70"> · BHD {ocrResult.amount.toFixed(3)}</span>}
                {ocrResult.date   && <span className="text-white/70"> · {ocrResult.date}</span>}
                <span className="block mt-0.5 text-white/30">Fields pre-filled below — review before saving.</span>
              </p>
            </div>
          )}
          {!ocrResult && !ocrError && !ocrLoading && (
            <p className="text-xs text-white/30 mt-1">
              Upload a receipt photo to automatically extract amount, date, and vendor.
            </p>
          )}
        </div>

        {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-navy-700 rounded-xl">
            {['expense', 'income'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  form.type === t
                    ? t === 'expense' ? 'bg-coral-500 text-white' : 'bg-emerald-500 text-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Amount (BHD) *</label>
            <input
              name="amount" type="number" step="0.001" min="0"
              value={form.amount} onChange={handleChange}
              placeholder="0.000" className="input-field"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Date *</label>
            <input name="date" type="date" value={form.date} onChange={handleChange} className="input-field" />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Category *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="input-field">
              <option value="">Select category…</option>
              {availableCats.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Payment Method *</label>
            <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="input-field">
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Description *</label>
            <input
              name="description" type="text"
              value={form.description} onChange={handleChange}
              placeholder="e.g. Monthly payroll" className="input-field"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Plus size={16} />
              {isEdit ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
