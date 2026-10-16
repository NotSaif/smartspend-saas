import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle, X } from 'lucide-react';
import { fmtBHD } from '../data/constants';

const EMPTY_FILTERS = { search: '', type: 'all', category: 'all', method: 'all', from: '', to: '', min: '', max: '', anomalies: false };

export default function Transactions() {
  const { transactions, categories, deleteTransaction, anomalyIds, loading } = useApp();
  const { canEdit } = useAuth();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [f, setF] = useState(EMPTY_FILTERS);
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const filtersActive = JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);

  const filtered = transactions.filter(t => {
    if (f.type !== 'all' && t.type !== f.type) return false;
    if (f.category !== 'all' && t.categoryId !== parseInt(f.category)) return false;
    if (f.method !== 'all' && t.paymentMethod !== f.method) return false;
    if (f.from && t.date < f.from) return false;
    if (f.to && t.date > f.to) return false;
    if (f.min !== '' && t.amount < Number(f.min)) return false;
    if (f.max !== '' && t.amount > Number(f.max)) return false;
    if (f.anomalies && !anomalyIds.has(t.id)) return false;
    if (f.search && !t.description.toLowerCase().includes(f.search.toLowerCase())) return false;
    return true;
  });

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const anomalyCount = filtered.filter(t => anomalyIds.has(t.id)).length;
  const net = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
            Transactions
            {anomalyCount > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                <AlertTriangle size={10} /> {anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'}
              </span>
            )}
          </h1>
          <p className="text-white/40 text-sm mt-1">{filtered.length} shown · {transactions.length} total{!canEdit && ' · read-only'}</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary flex items-center justify-center gap-2">
            <Plus size={16} /> Add Transaction
          </button>
        )}
      </div>

      {/* Totals of the filtered list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Income',   value: totalIncome,   color: 'text-emerald-400', icon: ArrowUpRight },
          { label: 'Expenses', value: totalExpenses, color: 'text-coral-400',   icon: ArrowDownRight },
          { label: 'Net',      value: net,           color: net >= 0 ? 'text-emerald-400' : 'text-coral-400', icon: net >= 0 ? ArrowUpRight : ArrowDownRight },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <Icon size={18} className={color} />
            <div>
              <p className="text-xs text-white/40">{filtersActive ? `Filtered ${label.toLowerCase()}` : label}</p>
              <p className={`font-bold text-sm ${color}`}>{fmtBHD(value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={f.search} onChange={set('search')} placeholder="Search descriptions…" className="input-field pl-8 text-sm py-2" />
          </div>
          <select value={f.type} onChange={set('type')} className="input-field w-auto text-sm py-2" aria-label="Type">
            <option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <select value={f.category} onChange={set('category')} className="input-field w-auto text-sm py-2" aria-label="Category">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select value={f.method} onChange={set('method')} className="input-field w-auto text-sm py-2" aria-label="Payment method">
            <option value="all">All methods</option><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <label className="flex items-center gap-2 text-white/50">From
            <input type="date" value={f.from} onChange={set('from')} className="input-field w-auto py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-white/50">To
            <input type="date" value={f.to} onChange={set('to')} className="input-field w-auto py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-white/50">BHD
            <input type="number" min="0" step="0.001" value={f.min} onChange={set('min')} placeholder="Min" className="input-field w-24 py-1.5 text-sm" />
            –
            <input type="number" min="0" step="0.001" value={f.max} onChange={set('max')} placeholder="Max" className="input-field w-24 py-1.5 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-amber-400 cursor-pointer select-none">
            <input type="checkbox" checked={f.anomalies} onChange={set('anomalies')} className="accent-amber-500 w-4 h-4" />
            Anomalies only
          </label>
          {filtersActive && (
            <button onClick={() => setF(EMPTY_FILTERS)} className="ml-auto flex items-center gap-1 text-white/40 hover:text-white">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-white/30 text-xs uppercase tracking-wide">
                {['Date', 'Description', 'Category', 'Method', 'Type', 'Amount', ''].map((h, i) => (
                  <th key={i} className={`px-4 py-3 font-medium ${h === 'Amount' || h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-white/30">
                  {loading ? 'Loading…' : transactions.length ? 'No transactions match these filters' : 'No transactions yet'}
                </td></tr>
              )}
              {filtered.map(t => {
                const isAnomaly = anomalyIds.has(t.id);
                return (
                  <tr key={t.id} className={`table-row ${isAnomaly ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-3 text-white/40 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isAnomaly && (
                          <span title="Anomaly: this expense is unusually high for its category">
                            <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                          </span>
                        )}
                        {t.date}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/80 max-w-[240px] truncate" title={t.description}>{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: (t.categoryColor || '#888') + '20', color: t.categoryColor || '#888' }}>
                        {t.categoryIcon} {t.categoryName || 'Uncategorised'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 capitalize">{t.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-xs ${t.type === 'income' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-coral-400 bg-coral-500/10 border-coral-500/30'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                      <span className={t.type === 'income' ? 'text-emerald-400' : isAnomaly ? 'text-amber-400' : 'text-coral-400'}>
                        {t.type === 'income' ? '+' : '−'}{fmtBHD(t.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setEditing(t); setModal(true); }} className="text-white/30 hover:text-brand-400 transition-colors" aria-label="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirmDelete(t)} className="text-white/30 hover:text-coral-400 transition-colors" aria-label="Delete"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <TransactionModal transaction={editing} onClose={() => { setModal(false); setEditing(null); }} />}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete transaction?"
          message={`"${confirmDelete.description}" (${fmtBHD(confirmDelete.amount)}) will be permanently removed.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteTransaction(confirmDelete.id); setConfirmDelete(null); }}
        />
      )}
    </div>
  );
}
