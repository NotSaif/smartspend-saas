import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import BudgetBar from '../components/BudgetBar';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { MONTH_NAMES } from '../data/mockData';

export default function Budgets() {
  const { budgets, categories, addBudget, updateBudget, deleteBudget, getCategorySpending } = useApp();
  const { currentUser, canEdit } = useAuth();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({ categoryId: '', amount: '' });
  const [error, setError] = useState('');

  const companyId = currentUser?.companyId || 1;
  const monthBudgets = budgets.filter(
    b => b.companyId === companyId && b.month === month && b.year === year
  );
  const expCats = categories.filter(c => c.type === 'expense' && c.companyId === companyId);

  const openAdd = () => {
    setEditing(null);
    setForm({ categoryId: '', amount: '' });
    setError('');
    setModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ categoryId: b.categoryId, amount: b.amount });
    setError('');
    setModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.amount) { setError('Please fill in all fields.'); return; }
    const payload = { categoryId: parseInt(form.categoryId), amount: parseFloat(form.amount), month, year, companyId };
    if (editing) updateBudget(editing.id, payload);
    else addBudget(payload);
    setModal(false);
  };

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = monthBudgets.reduce((s, b) => s + getCategorySpending(b.categoryId, month, year, companyId), 0);
  const overCount   = monthBudgets.filter(b => getCategorySpending(b.categoryId, month, year, companyId) > b.amount).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Planning</h1>
          <p className="text-white/40 text-sm mt-1">{monthBudgets.length} budgets set for {MONTH_NAMES[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="input-field w-auto py-2 text-sm"
          >
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="input-field w-auto py-2 text-sm"
          >
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {canEdit && (
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Set Budget
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Budget',    val: `BHD ${totalBudget.toFixed(3)}`,  c: 'text-brand-400' },
          { label: 'Total Spent',     val: `BHD ${totalSpent.toFixed(3)}`,   c: 'text-amber-400' },
          { label: 'Over Budget',     val: `${overCount} categor${overCount !== 1 ? 'ies' : 'y'}`, c: overCount > 0 ? 'text-coral-400' : 'text-emerald-400' },
        ].map(({ label, val, c }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs text-white/40 mb-1">{label}</p>
            <p className={`text-xl font-bold ${c}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Budget bars grid */}
      {monthBudgets.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/20">
          <p className="text-lg mb-2">No budgets set</p>
          <p className="text-sm">Click "Set Budget" to create a budget for {MONTH_NAMES[month - 1]}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {monthBudgets.map(b => {
            const cat = categories.find(c => c.id === b.categoryId);
            if (!cat) return null;
            const spent = getCategorySpending(b.categoryId, month, year, companyId);
            return (
              <div key={b.id} className="relative group">
                <BudgetBar category={cat} spent={spent} budget={b.amount} />
                {canEdit && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(b)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-700 text-white/40 hover:text-brand-400 transition-colors"><Edit2 size={12} /></button>
                    <button onClick={() => setConfirmDelete(b.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-700 text-white/40 hover:text-coral-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overall progress */}
      {monthBudgets.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold text-white mb-3">Overall Budget Utilization</h2>
          <div className="w-full bg-navy-700 rounded-full h-4 overflow-hidden">
            {(() => {
              const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
              const color = pct >= 100 ? 'bg-coral-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500';
              return (
                <div className={`${color} h-4 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              );
            })()}
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span>BHD {totalSpent.toFixed(3)} spent</span>
            <span>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of BHD {totalBudget.toFixed(3)}</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative glass-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Budget' : 'Set Budget'}</h2>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} className="input-field">
                  <option value="">Select expense category…</option>
                  {expCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Budget Amount (BHD) *</label>
                <input
                  type="number" step="0.001" min="0"
                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.000" className="input-field"
                />
              </div>
              <div className="text-xs text-white/30 p-3 bg-navy-700 rounded-xl">
                Period: {MONTH_NAMES[month - 1]} {year}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save size={15} /> {editing ? 'Update' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative glass-card p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="text-coral-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Remove Budget?</h3>
            <p className="text-white/40 text-sm mb-5">This will remove the budget limit for this category.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => { deleteBudget(confirmDelete); setConfirmDelete(null); }} className="btn-danger flex-1">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
