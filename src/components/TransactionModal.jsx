import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PAYMENT_METHODS } from '../data/mockData';

export default function TransactionModal({ transaction, onClose }) {
  const { categories, addTransaction, updateTransaction } = useApp();
  const { currentUser } = useAuth();
  const isEdit = Boolean(transaction);

  const [form, setForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    categoryId: '',
    description: '',
    paymentMethod: 'transfer',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        categoryId: transaction.categoryId,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod,
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
      amount: parseFloat(form.amount),
      categoryId: parseInt(form.categoryId),
      companyId: currentUser?.companyId || 1,
      userId: currentUser?.id || 1,
    };
    if (isEdit) updateTransaction(transaction.id, payload);
    else addTransaction(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-card w-full max-w-lg p-6 animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
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
