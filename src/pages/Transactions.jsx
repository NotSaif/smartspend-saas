import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import TransactionModal from '../components/TransactionModal';
import { Plus, Search, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

export default function Transactions() {
  const { transactions, categories, deleteTransaction } = useApp();
  const { currentUser, canEdit } = useAuth();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const companyId = currentUser?.companyId || 1;
  const userTx = transactions.filter(t => t.companyId === companyId);

  const filtered = userTx.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCat !== 'all' && t.categoryId !== parseInt(filterCat)) return false;
    if (filterMethod !== 'all' && t.paymentMethod !== filterMethod) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleDelete = (id) => {
    deleteTransaction(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-white/40 text-sm mt-1">{filtered.length} records · {userTx.length} total</p>
        </div>
        {canEdit && (
          <button onClick={() => { setEditing(null); setModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Transaction
          </button>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Filtered Income',   value: totalIncome,               color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: ArrowUpRight },
          { label: 'Filtered Expenses', value: totalExpenses,             color: 'text-coral-400',   bg: 'bg-coral-500/10',   icon: ArrowDownRight },
          { label: 'Net',               value: totalIncome - totalExpenses, color: (totalIncome - totalExpenses) >= 0 ? 'text-emerald-400' : 'text-coral-400', bg: 'bg-white/5', icon: ArrowUpRight },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`glass-card p-4 flex items-center gap-3 ${bg}`}>
            <Icon size={18} className={color} />
            <div>
              <p className="text-xs text-white/40">{label}</p>
              <p className={`font-bold text-sm ${color}`}>BHD {value.toFixed(3)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions…" className="input-field pl-8 text-sm py-2"
            />
          </div>
          {[
            { label: 'Type',   value: filterType,   set: setFilterType,   opts: [['all','All Types'],['income','Income'],['expense','Expense']] },
            { label: 'Category', value: filterCat, set: setFilterCat,   opts: [['all','All Categories'], ...categories.filter(c=>c.companyId===companyId).map(c=>[c.id, `${c.icon} ${c.name}`])] },
            { label: 'Method', value: filterMethod, set: setFilterMethod, opts: [['all','All Methods'],['cash','Cash'],['card','Card'],['transfer','Transfer']] },
          ].map(({ label, value, set, opts }) => (
            <select key={label} value={value} onChange={e => set(e.target.value)} className="input-field w-auto text-sm py-2">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-white/30 text-xs uppercase tracking-wide">
                {['Date','Description','Category','Method','Type','Amount',''].map(h => (
                  <th key={h} className={`px-4 py-3 font-medium ${h === 'Amount' || h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-white/20">No transactions found</td></tr>
              )}
              {filtered.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <tr key={t.id} className="table-row">
                    <td className="px-4 py-3 text-white/40 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 text-white/80 max-w-[200px] truncate">{t.description}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background:(cat?.color||'#888')+'20', color: cat?.color||'#888' }}>
                        {cat?.icon} {cat?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 capitalize">{t.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-xs ${t.type==='income' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-coral-400 bg-coral-500/10 border-coral-500/30'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={t.type==='income' ? 'text-emerald-400' : 'text-coral-400'}>
                        {t.type==='income' ? '+' : '-'}BHD {t.amount.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setEditing(t); setModal(true); }} className="text-white/30 hover:text-brand-400 transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => setConfirmDelete(t.id)} className="text-white/30 hover:text-coral-400 transition-colors"><Trash2 size={14} /></button>
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

      {/* Modal */}
      {modal && <TransactionModal transaction={editing} onClose={() => { setModal(false); setEditing(null); }} />}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative glass-card p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="text-coral-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Delete Transaction?</h3>
            <p className="text-white/40 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
