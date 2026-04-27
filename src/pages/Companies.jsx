import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, X, Save, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { companiesAPI } from '../services/api';
import { toast } from '../components/Toast';

const INDUSTRIES = [
  'Retail & Trading', 'Information Technology', 'Construction',
  'Food & Beverage', 'Healthcare', 'Education', 'Finance & Banking',
  'Real Estate', 'Manufacturing', 'Logistics & Transport', 'Other',
];

const emptyForm = { name: '', industry: '', location: '' };

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null); // company object or null
  const [form, setForm]           = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await companiesAPI.getAll();
      setCompanies(res.data);
    } catch {
      toast.error('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, industry: c.industry || '', location: c.location || '' }); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await companiesAPI.update(editing.id, form);
        setCompanies(p => p.map(c => c.id === editing.id ? { ...c, ...res.data } : c));
        toast.success('Company updated.');
      } else {
        const res = await companiesAPI.create(form);
        setCompanies(p => [res.data, ...p]);
        toast.success('Company added!');
      }
      closeModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await companiesAPI.delete(id);
      setCompanies(p => p.filter(c => c.id !== id));
      toast.warning(`${name} deleted.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fmt = (n) => n ? `BHD ${parseFloat(n).toLocaleString('en-BH', { minimumFractionDigits: 3 })}` : 'BHD 0.000';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-white/40 text-sm mt-1">{companies.length} registered {companies.length === 1 ? 'company' : 'companies'}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Company
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-white/40">Loading…</div>
      ) : companies.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Building2 size={40} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No companies yet. Click "Add Company" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map(c => (
            <div key={c.id} className="glass-card p-5 flex flex-col gap-4">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold text-white text-base leading-tight flex items-center gap-2">
                      {c.name}
                      {c.is_demo && <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold rounded">DEMO</span>}
                    </h2>
                    <p className="text-xs text-white/40 mt-0.5">{c.industry || '—'} · {c.location || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => openEdit(c)}
                    className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 flex items-center justify-center transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)}
                    className="w-8 h-8 rounded-lg bg-coral-500/10 text-coral-400 hover:bg-coral-500/20 flex items-center justify-center transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <Users size={13} className="text-white/30 mx-auto mb-1" />
                  <p className="text-white font-semibold text-sm">{c.user_count || 0}</p>
                  <p className="text-white/30 text-xs">Users</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <ArrowUpRight size={13} className="text-emerald-400 mx-auto mb-1" />
                  <p className="text-emerald-400 font-semibold text-xs">{fmt(c.total_income)}</p>
                  <p className="text-white/30 text-xs">Income</p>
                </div>
                <div className="bg-white/3 rounded-xl p-3 text-center">
                  <ArrowDownRight size={13} className="text-coral-400 mx-auto mb-1" />
                  <p className="text-coral-400 font-semibold text-xs">{fmt(c.total_expenses)}</p>
                  <p className="text-white/30 text-xs">Expenses</p>
                </div>
              </div>

              <p className="text-xs text-white/20">{c.transaction_count || 0} transactions · ID #{c.id}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 size={18} className="text-brand-400" />
                {editing ? 'Edit Company' : 'Add New Company'}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Company Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Al-Mansoori Trading Co."
                  required
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Industry</label>
                <select
                  value={form.industry}
                  onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  className="input-field"
                  placeholder="e.g. Manama, Bahrain"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <Save size={15} /> {saving ? 'Saving…' : (editing ? 'Update' : 'Add Company')}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
