import { useState } from 'react';
import { useApp } from '../context/AppContext';
import BudgetBar from '../components/BudgetBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { PageHeader, Modal, FormError, EmptyState } from '../components/ui';
import { Plus, Edit2, Trash2, Save, PieChart, Wallet, Receipt, Bell } from 'lucide-react';
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
      <PageHeader kicker="Planning" title="Budget Planning" subtitle={`${monthBudgets.length} budgets for ${MONTH_NAMES[month - 1]} ${year}`}>
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="input-field w-auto py-2 text-sm" aria-label="Month">
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field w-auto py-2 text-sm" aria-label="Year">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Set Budget</button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Budget', val: fmtBHD(totalBudget), c: 'text-brand-200', chip: 'bg-brand-500/20 text-brand-200', icon: Wallet },
          { label: 'Total Spent', val: fmtBHD(totalSpent), c: 'text-amber-300', chip: 'bg-amber-500/15 text-amber-300', icon: Receipt },
          { label: 'Alerts', val: `${overCount} over · ${nearCount} near limit`, c: overCount ? 'text-coral-300' : nearCount ? 'text-amber-300' : 'text-emerald-300', chip: 'bg-coral-500/15 text-coral-300', icon: Bell },
        ].map(({ label, val, c, chip, icon: Icon }, i) => (
          <div key={label} className="glass-card flex items-center gap-4 p-5 animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${chip}`}><Icon size={19} /></span>
            <div><p className="text-xs text-white/45">{label}</p><p className={`num font-display text-xl font-bold ${c}`}>{val}</p></div>
          </div>
        ))}
      </div>

      {monthBudgets.length > 0 && (
        <div className="glass-card glow-border p-6 animate-rise">
          <div className="mb-3 flex items-end justify-between">
            <div><p className="kicker">This period</p><h2 className="section-title mt-1">Overall Budget Utilisation</h2></div>
            <p className={`num font-display text-3xl font-extrabold ${overallPct > 100 ? 'text-coral-300' : overallPct >= BUDGET_ALERT_PCT ? 'text-amber-300' : 'text-gradient'}`}>{Math.round(overallPct)}%</p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className={`h-3 rounded-full bg-gradient-to-r transition-all duration-1000 ${overallPct > 100 ? 'from-coral-500 to-coral-400' : overallPct >= BUDGET_ALERT_PCT ? 'from-amber-500 to-amber-300' : 'from-brand-500 to-cyan-400'}`}
              style={{ width: `${Math.min(overallPct, 100)}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/45">
            <span className="num">{fmtBHD(totalSpent)} spent</span>
            <span className="num">{Math.round(overallPct)}% of {fmtBHD(totalBudget)}</span>
          </div>
        </div>
      )}

      {monthBudgets.length === 0 ? (
        <EmptyState icon={PieChart} title="No budgets set">Click "Set Budget" to add a spending limit for {MONTH_NAMES[month - 1]}.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {monthBudgets.map(b => (
            <div key={b.id} className="group relative animate-rise">
              <BudgetBar category={b.category} spent={b.spent} budget={b.amount} />
              <div className="absolute bottom-10 right-3 flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                <button onClick={() => openEdit(b)} aria-label="Edit budget" className="btn-icon bg-navy-800/90 hover:!text-brand-300"><Edit2 size={13} /></button>
                <button onClick={() => setConfirmDelete(b)} aria-label="Remove budget" className="btn-icon bg-navy-800/90 hover:!text-coral-400"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Edit Budget' : 'Set Budget'} icon={PieChart} onClose={() => setModal(false)}>
          <FormError>{error}</FormError>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Expense Category *</label>
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
              <label className="label">Monthly Limit (BHD) *</label>
              <input type="number" step="0.001" min="0.001" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.000" className="input-field num" />
            </div>
            <p className="rounded-2xl bg-white/[0.04] p-3 text-xs text-white/50 ring-1 ring-inset ring-white/[0.06]">
              Period: {MONTH_NAMES[month - 1]} {year}. You will be alerted when spending reaches {BUDGET_ALERT_PCT}% of the limit.
            </p>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                <Save size={15} /> {saving ? 'Saving…' : editing ? 'Update' : 'Set Budget'}
              </button>
            </div>
          </form>
        </Modal>
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
