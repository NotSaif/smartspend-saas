import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const COLORS = ['#EF4444','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#84CC16','#10B981','#3B82F6','#2563EB','#F97316'];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name:'', type:'expense', color: COLORS[0], icon:'📁', companyId:1 });
  const [error, setError] = useState('');

  const openAdd = () => { setEditing(null); setForm({ name:'', type:'expense', color:COLORS[0], icon:'📁', companyId:1 }); setError(''); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name:c.name, type:c.type, color:c.color, icon:c.icon, companyId:c.companyId }); setError(''); setModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    if (editing) updateCategory(editing.id, form);
    else addCategory(form);
    setModal(false);
  };

  const expCats = categories.filter(c => c.type === 'expense');
  const incCats = categories.filter(c => c.type === 'income');

  const CatCard = ({ c }) => (
    <div className="glass-card p-4 flex items-center gap-3 group hover:border-white/20 transition-all">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: c.color + '20' }}>
        {c.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">{c.name}</p>
        <p className="text-xs text-white/30 capitalize">{c.type}</p>
      </div>
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"><Edit2 size={13}/></button>
        <button onClick={() => setConfirmDelete(c.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-coral-400 hover:bg-coral-500/10 transition-colors"><Trash2 size={13}/></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-white/40 text-sm mt-1">{categories.length} total · {expCats.length} expense · {incCats.length} income</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add Category</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[['expense', expCats, 'text-coral-400'], ['income', incCats, 'text-emerald-400']].map(([type, cats, tc]) => (
          <div key={type}>
            <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${tc}`}>{type} Categories</h2>
            <div className="space-y-2">
              {cats.length === 0 && <div className="glass-card p-6 text-center text-white/20 text-sm">No {type} categories</div>}
              {cats.map(c => <CatCard key={c.id} c={c}/>)}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <div className="relative glass-card w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white"><X size={20}/></button>
            </div>
            {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-navy-700 rounded-xl">
                {['expense','income'].map(t => (
                  <button key={t} type="button" onClick={() => setForm(p => ({...p, type:t}))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${form.type===t ? (t==='expense'?'bg-coral-500 text-white':'bg-emerald-500 text-white') : 'text-white/40 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Category Name *</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Marketing & Ads" className="input-field"/>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Icon (emoji)</label>
                <input value={form.icon} onChange={e => setForm(p=>({...p,icon:e.target.value}))} placeholder="📁" className="input-field"/>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(p=>({...p,color}))}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${form.color===color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{background:color}}/>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><Save size={15}/>{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}/>
          <div className="relative glass-card p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="text-coral-400 mx-auto mb-3"/>
            <h3 className="text-lg font-bold text-white mb-1">Delete Category?</h3>
            <p className="text-white/40 text-sm mb-5">Transactions using this category will lose their category.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => { deleteCategory(confirmDelete); setConfirmDelete(null); }} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
