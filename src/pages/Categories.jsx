import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, Save, Tags, TrendingUp, TrendingDown } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { PageHeader, Modal, FormError } from '../components/ui';

const COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#10B981', '#3B82F6', '#6366F1', '#F97316'];

export default function Categories() {
  const { categories, transactions, saveCategory, deleteCategory } = useApp();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense', color: COLORS[0], icon: '📁' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const usage = (id) => transactions.filter(t => t.categoryId === id).length;

  const openAdd = () => { setEditing(null); setForm({ name: '', type: 'expense', color: COLORS[0], icon: '📁' }); setError(''); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, type: c.type, color: c.color, icon: c.icon }); setError(''); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    setSaving(true);
    const err = await saveCategory(editing?.id, { ...form, name: form.name.trim() });
    setSaving(false);
    if (err) setError(err); else setModal(false);
  };

  const expCats = categories.filter(c => c.type === 'expense');
  const incCats = categories.filter(c => c.type === 'income');

  const CatCard = ({ c, i }) => {
    const n = usage(c.id);
    return (
      <div className="glass-card group flex items-center gap-3.5 !rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl ring-1 ring-inset ring-white/10" style={{ background: `linear-gradient(135deg, ${c.color}40, ${c.color}10)` }}>
          {c.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{c.name}</p>
          <p className="text-xs text-white/40">{n} transaction{n === 1 ? '' : 's'}</p>
        </div>
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: c.color, boxShadow: `0 0 12px ${c.color}` }} />
        <div className="flex gap-0.5 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button onClick={() => openEdit(c)} aria-label="Edit category" className="btn-icon hover:!text-brand-300"><Edit2 size={13} /></button>
          <button onClick={() => setConfirmDelete(c)} aria-label="Delete category" className="btn-icon hover:!text-coral-400"><Trash2 size={13} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker="Organise" title="Categories" subtitle={`${categories.length} total · ${expCats.length} expense · ${incCats.length} income`}>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} />Add Category</button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[['expense', expCats, 'text-coral-300', TrendingDown, 'bg-coral-500/15'], ['income', incCats, 'text-emerald-300', TrendingUp, 'bg-emerald-500/15']].map(([type, cats, tc, Icon, chip]) => (
          <div key={type}>
            <h2 className={`mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] ${tc}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${chip}`}><Icon size={13} /></span>
              {type} Categories
            </h2>
            <div className="space-y-2">
              {cats.length === 0 && <div className="glass-card p-6 text-center text-sm text-white/30">No {type} categories</div>}
              {cats.map((c, i) => <CatCard key={c.id} c={c} i={i} />)}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Category' : 'Add Category'} icon={Tags} onClose={() => setModal(false)}>
          <FormError>{error}</FormError>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 rounded-2xl bg-navy-950/60 p-1 ring-1 ring-inset ring-white/[0.08]">
              {['expense', 'income'].map(t => (
                <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                  className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition-all ${form.type === t ? (t === 'expense' ? 'bg-gradient-to-r from-coral-500 to-[#E11D48] text-white' : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white') : 'text-white/45 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_5.5rem] gap-3">
              <div>
                <label className="label">Category Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Marketing & Ads" className="input-field" />
              </div>
              <div>
                <label className="label">Icon</label>
                <input value={form.icon} maxLength={4} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} placeholder="📁" className="input-field text-center text-lg" />
              </div>
            </div>
            <div>
              <label className="label">Colour</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map(color => (
                  <button key={color} type="button" onClick={() => setForm(p => ({ ...p, color }))} aria-label={`Colour ${color}`}
                    className={`h-9 w-9 rounded-xl transition-all hover:scale-110 ${form.color === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-navy-800' : ''}`}
                    style={{ background: color, boxShadow: form.color === color ? `0 0 18px ${color}` : 'none' }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: `linear-gradient(135deg, ${form.color}40, ${form.color}10)` }}>{form.icon}</span>
              <span className="text-sm font-semibold text-white">{form.name || 'Preview'}</span>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1"><Save size={15} />{saving ? 'Saving…' : editing ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Delete category?"
          message={usage(confirmDelete.id)
            ? `"${confirmDelete.name}" is used by ${usage(confirmDelete.id)} transaction(s), so it cannot be deleted until they are moved or removed.`
            : `"${confirmDelete.name}" and any budgets for it will be removed.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { deleteCategory(confirmDelete.id); setConfirmDelete(null); }} />
      )}
    </div>
  );
}
