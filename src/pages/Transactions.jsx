import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { PageHeader } from '../components/ui';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, ArrowDownRight, AlertTriangle, X, SlidersHorizontal, Scale } from 'lucide-react';
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
      <PageHeader kicker="Ledger" subtitle={`${filtered.length} shown · ${transactions.length} total${!canEdit ? ' · read-only' : ''}`}
        title={<>Transactions
          {anomalyCount > 0 && (
            <span className="badge bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30 !text-xs">
              <AlertTriangle size={11} /> {anomalyCount} anomal{anomalyCount === 1 ? 'y' : 'ies'}
            </span>
          )}</>}>
        {canEdit && (
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary">
            <Plus size={16} /> Add Transaction
          </button>
        )}
      </PageHeader>

      {/* Totals of the filtered list */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Income',   value: totalIncome,   tone: 'text-emerald-300', chip: 'bg-emerald-500/15 text-emerald-300', icon: ArrowUpRight },
          { label: 'Expenses', value: totalExpenses, tone: 'text-coral-300',   chip: 'bg-coral-500/15 text-coral-300',     icon: ArrowDownRight },
          { label: 'Net',      value: net,           tone: net >= 0 ? 'text-emerald-300' : 'text-coral-300', chip: 'bg-brand-500/20 text-brand-200', icon: Scale },
        ].map(({ label, value, tone, chip, icon: Icon }, i) => (
          <div key={label} className="glass-card flex items-center gap-4 p-4 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}><Icon size={19} /></span>
            <div>
              <p className="text-xs text-white/45">{filtersActive ? `Filtered ${label.toLowerCase()}` : label}</p>
              <p className={`num font-display text-lg font-bold ${tone}`}>{fmtBHD(value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card space-y-3 p-4 animate-rise">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={f.search} onChange={set('search')} placeholder="Search descriptions…" className="input-field py-2 pl-10 text-sm" />
          </div>
          <select value={f.type} onChange={set('type')} className="input-field w-auto py-2 text-sm" aria-label="Type">
            <option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
          <select value={f.category} onChange={set('category')} className="input-field w-auto py-2 text-sm" aria-label="Category">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select value={f.method} onChange={set('method')} className="input-field w-auto py-2 text-sm" aria-label="Payment method">
            <option value="all">All methods</option><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.05] pt-3 text-sm">
          <SlidersHorizontal size={15} className="text-white/30" />
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
          <label className={`chip cursor-pointer select-none transition-all ${f.anomalies ? 'border-amber-400/40 bg-amber-500/15 text-amber-300' : 'border-white/10 bg-white/[0.03] text-amber-300/80 hover:bg-amber-500/10'}`}>
            <input type="checkbox" checked={f.anomalies} onChange={set('anomalies')} className="h-3.5 w-3.5 accent-amber-500" />
            <AlertTriangle size={12} /> Anomalies only
          </label>
          {filtersActive && (
            <button onClick={() => setF(EMPTY_FILTERS)} className="ml-auto flex items-center gap-1 text-white/45 transition-colors hover:text-white">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden animate-rise">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                {['Date', 'Description', 'Category', 'Method', 'Type', 'Amount', ''].map((h, i) => (
                  <th key={i} className={`px-5 py-4 font-semibold ${h === 'Amount' || h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-white/35">
                  {loading ? 'Loading…' : transactions.length ? 'No transactions match these filters' : 'No transactions yet'}
                </td></tr>
              )}
              {filtered.map(t => {
                const isAnomaly = anomalyIds.has(t.id);
                return (
                  <tr key={t.id} className={`table-row group ${isAnomaly ? 'bg-amber-500/[0.06] shadow-[inset_3px_0_0_rgba(251,191,36,0.8)]' : ''}`}>
                    <td className="whitespace-nowrap px-5 py-3.5 text-white/45">
                      <div className="flex items-center gap-1.5">
                        {isAnomaly && (
                          <span title="Anomaly: this expense is unusually high for its category">
                            <AlertTriangle size={13} className="flex-shrink-0 text-amber-400" />
                          </span>
                        )}
                        <span className="num">{t.date}</span>
                      </div>
                    </td>
                    <td className="max-w-[260px] truncate px-5 py-3.5 font-medium text-white/90" title={t.description}>{t.description}</td>
                    <td className="px-5 py-3.5">
                      <span className="chip whitespace-nowrap border-transparent" style={{ background: (t.categoryColor || '#888') + '1f', color: t.categoryColor || '#aaa' }}>
                        {t.categoryIcon} {t.categoryName || 'Uncategorised'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 capitalize text-white/45">{t.paymentMethod}</td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ring-1 ring-inset ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25' : 'bg-coral-500/10 text-coral-300 ring-coral-400/25'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold">
                      <span className={`num ${t.type === 'income' ? 'text-emerald-300' : isAnomaly ? 'text-amber-300' : 'text-coral-300'}`}>
                        {t.type === 'income' ? '+' : '−'}{fmtBHD(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1 opacity-100 transition-opacity lg:opacity-40 lg:group-hover:opacity-100">
                          <button onClick={() => { setEditing(t); setModal(true); }} className="btn-icon hover:!text-brand-300" aria-label="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirmDelete(t)} className="btn-icon hover:!text-coral-400" aria-label="Delete"><Trash2 size={14} /></button>
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
