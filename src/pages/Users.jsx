import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { ROLES } from '../data/mockData';
import { usersAPI, companiesAPI } from '../services/api';
import { toast } from '../components/Toast';

const isLive = () => !!localStorage.getItem('smartspend_token');

export default function Users() {
  const [users, setUsers]       = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'password123', role:'employee', companyId:'' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([usersAPI.getAll(), companiesAPI.getAll()]);
      setUsers(uRes.data);
      setCompanies(cRes.data);
    } catch (e) {
      toast.error('Failed to load: ' + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name:'', email:'', password:'password123', role:'employee', companyId:'' });
    setError(''); setModal(true);
  };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name:u.name, email:u.email, password:'', role:u.role, companyId: u.company_id ?? u.companyId ?? '' });
    setError(''); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    const payload = {
      name: form.name, email: form.email, role: form.role,
      companyId: form.companyId ? parseInt(form.companyId) : null,
      ...((!editing || form.password) && { password: form.password || 'password123' }),
    };
    try {
      if (editing) {
        const res = await usersAPI.update(editing.id, payload);
        setUsers(p => p.map(u => u.id === editing.id ? res.data : u));
        toast.success('User updated.');
      } else {
        const res = await usersAPI.create(payload);
        setUsers(p => [res.data, ...p]);
        toast.success('User added!');
      }
      setModal(false);
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await usersAPI.delete(id);
      setUsers(p => p.filter(u => u.id !== id));
      setConfirmDelete(null);
      toast.warning('User deleted.');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} registered users</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add User</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/5">
              <tr className="text-white/30 text-xs uppercase tracking-wide">
                {['User','Email','Role','Company','Actions'].map(h=>(
                  <th key={h} className={`px-4 py-3 font-medium ${h==='Actions'?'text-right':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const co = companies.find(c => c.id === (u.company_id ?? u.companyId));
                const roleStyle = ROLES[u.role]?.color || '';
                return (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {u.avatar}
                        </div>
                        <span className="font-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/50">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-xs ${roleStyle}`}>{ROLES[u.role]?.label || u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40">
                      {co?.name ? (
                        <div className="flex items-center gap-2">
                          {co.name}
                          {u.company_is_demo && <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold rounded">DEMO</span>}
                        </div>
                      ) : <span className="text-white/20">All Companies</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>openEdit(u)} className="text-white/30 hover:text-brand-400 transition-colors"><Edit2 size={14}/></button>
                        <button onClick={()=>setConfirmDelete(u.id)} className="text-white/30 hover:text-coral-400 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Role legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(ROLES).map(([key, {label, color}]) => (
          <div key={key} className={`badge border text-xs ${color}`}>{label}</div>
        ))}
      </div>

      {/* Password field in modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={()=>setModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>
          <div className="relative glass-card w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing?'Edit User':'Add User'}</h2>
              <button onClick={()=>setModal(false)} className="text-white/40 hover:text-white"><X size={20}/></button>
            </div>
            {error&&<p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Full Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Ahmed Al-Zain" className="input-field"/>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Email *</label>
                <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="user@company.bh" className="input-field"/>
              </div>
              {!editing && (
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Password</label>
                  <input type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="Min 6 characters" className="input-field"/>
                </div>
              )}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Role</label>
                <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} className="input-field">
                  {Object.entries(ROLES).map(([k,{label}])=><option key={k} value={k}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Company</label>
                <select value={form.companyId} onChange={e=>setForm(p=>({...p,companyId:e.target.value}))} className="input-field">
                  <option value="">All Companies (Admin)</option>
                  {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2"><Save size={15}/>{editing?'Update':'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setConfirmDelete(null)}/>
          <div className="relative glass-card p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="text-coral-400 mx-auto mb-3"/>
            <h3 className="text-lg font-bold text-white mb-1">Delete User?</h3>
            <p className="text-white/40 text-sm mb-5">This user will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmDelete(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={()=>handleDelete(confirmDelete)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
