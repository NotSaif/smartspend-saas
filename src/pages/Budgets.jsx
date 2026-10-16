import { useState } from 'react';
import { useApp } from '../context/AppContext';
import BudgetBar from '../components/BudgetBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { MONTH_NAMES, BUDGET_ALERT_PCT, fmtBHD } from '../data/constants';

export default function Budgets() {
  const { budgets, categories, saveBudget, deleteBudget, getCategorySpending } = useApp();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ categoryId: '', amount: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const expCats = categories.filter(c => c.type === 'expense');
  const monthBudgets = budgets
    .filter(b => b.month === month && b.year === year)
    .map(b => ({ ...b, category: categories.find(c => c.id === b.categoryId), spent: getCategorySpending(b.categoryId, month, year) }))
    .filter(b => b.category)
    .sort((a, b) => a.category.name.localeCompare(b.category.name));
  const usedCatIds = new Set(monthBudgets.map(b => b.categoryId));

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + b.spent, 0);
  const overCount = monthBudgets.filter(b => b.spent > b.amount).length;
  const nearCount = monthBudgets.filter(b => b.spent <= b.amount && b.spent >= b.amount * BUDGET_ALERT_PCT / 100).length;
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const openAdd = () => { setEditing(null); setForm({ categoryId: '', amount: '' }); setError(''); setModal(true); };
  const openEdit = (b) => { setEditing(b); setForm({ categoryId: b.categoryId, amount: b.amount }); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.amount) { setError('Please fill in all fields.'); return; }
    if (Number(form.amount) <= 0) { setError('Budget must be greater than zero.'); return; }
    setSaving(true);
    const err = await saveBudget(editing?.id, { categoryId: parseInt(form.categoryId), amount: parseFloat(form.amount), month, year });
    setSaving(false);
    if (err) setError(err); else setModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Planning</h1>
          <p className="text-white/40 text-sm mt-1">{monthBudgets.length} budgets for {MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="input-field w-auto py-2 text-sm" aria-label="Month">
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field w-auto py-2 text-sm" aria-label="Year">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Set Budget</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', val: fmtBHD(totalBudget), c: 'text-brand-400' },
          { label: 'Total Spent', val: fmtBHD(totalSpent), c: 'text-amber-400' },
          { label: 'Alerts', val: `${overCount} over · ${nearCount} near limit`, c: overCount ? 'text-coral-400' : nearCount ? 'text-amber-400' : 'text-emerald-400' },
        ].map(({ label, val, c }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs text-white/40 mb-1">{label}</p>
            <p className={`text-xl font-bold ${c}`}>{val}</p>
          </div>
        ))}
      </div>

      {monthBudgets.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/30">
          <p className="text-lg mb-2">No budgets set</p>
          <p className="text-sm">Click "Set Budget" to add a spending limit for {MONTH_NAMES[month - 1]}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {monthBudgets.map(b => (
            <div key={b.id} className="relative group">
              <BudgetBar category={b.category} spent={b.spent} budget={b.amount} />
              <div className="absolute bottom-11 right-3 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(b)} aria-label="Edit budget" className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-700 text-white/40 hover:text-brand-400 transition-colors"><Edit2 size={12} /></button>
                <button onClick={() => setConfirmDelete(b)} aria-label="Remove budget" className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-700 text-white/40 hover:text-coral-400 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {monthBudgets.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white mb-3">Overall Budget Utilisation</h2>
          <div className="w-full bg-navy-700 rounded-full h-4 overflow-hidden">
            <div className={`${overallPct > 100 ? 'bg-coral-500' : overallPct >= BUDGET_ALERT_PCT ? 'bg-amber-500' : 'bg-brand-500'} h-4 rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(overallPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>{fmtBHD(totalSpent)} spent</span>
            <span>{Math.round(overallPct)}% of {fmtBHD(totalBudget)}</span>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative glass-card w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Budget' : 'Set Budget'}</h2>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white" aria-label="Close"><X size={20} /></button>
            </div>
            {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Expense Category *</label>
                <select value={form.categoryId} disabled={!!editing} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className="input-field disabled:opacity-60">
                  <option value="">Select expense category…</option>
                  {expCats.map(c => (
                    <option key={c.id} value={c.id} disabled={!editing && usedCatIds.has(c.id)}>
                      {c.icon} {c.name}{!editing && usedCatIds.has(c.id) ? ' (already set)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Monthly Limit (BHD) *</label>
                <input type="number" step="0.001" min="0.001" value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.000" className="input-field" />
              </div>
              <p className="text-xs text-white/40 p-3 bg-navy-700 rounded-xl">
                Period: {MONTH_NAMES[month - 1]} {year}. You will be alerted when spending reaches {BUDGET_ALERT_PCT}% of the limit.
              </p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                  <Save size={15} /> {saving ? 'Saving…' : editing ? 'Update' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Remove budget?" confirmLabel="Remove"
          message={`The ${confirmDelete.category.name} limit for ${MONTH_NAMES[month - 1]} ${year} will be removed.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteBudget(confirmDelete.id); setConfirmDelete(null); }} />
      )}
    </div>
  );
}
