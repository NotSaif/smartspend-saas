import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { ROLES } from '../data/constants';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const EMPTY = { name: '', email: '', password: '', role: 'employee', isActive: true };

// Business Owner: manage the user accounts of the company (UR-10, FR-14)
export default function Users() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersAPI.getAll()
      .then(res => setUsers(res.data))
      .catch(e => toast.error('Failed to load users: ' + e.message))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.is_active }); setError(''); setModal(true); };

  const replace = (u) => setUsers(p => p.map(x => x.id === u.id ? u : x));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    if (!editing && form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    try {
      if (editing) {
        replace((await usersAPI.update(editing.id, { name: form.name, email: form.email, role: form.role, isActive: form.isActive })).data);
        toast.success('User updated.');
      } else {
        const res = await usersAPI.create({ name: form.name, email: form.email, password: form.password, role: form.role });
        setUsers(p => [...p, res.data]);
        toast.success('User added. Share the password with them securely.');
      }
      setModal(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      replace((await usersAPI.update(u.id, { name: u.name, email: u.email, role: u.role, isActive: !u.is_active })).data);
      toast.success(u.is_active ? `${u.name} deactivated.` : `${u.name} reactivated.`);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (u) => {
    try {
      await usersAPI.delete(u.id);
      setUsers(p => p.filter(x => x.id !== u.id));
      toast.warning('User deleted.');
    } catch (err) { toast.error(err.message); }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} users in {currentUser?.companyName}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-2"><Plus size={16} />Add User</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-white/30 text-xs uppercase tracking-wide">
                  {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isOwner = u.role === 'owner';
                  return (
                    <tr key={u.id} className={`table-row ${u.is_active ? '' : 'opacity-50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-xs font-bold flex-shrink-0">{u.avatar}</div>
                          <span className="font-medium text-white whitespace-nowrap">{u.name}{u.id === currentUser?.id && <span className="text-white/30 font-normal"> (you)</span>}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50">{u.email}</td>
                      <td className="px-4 py-3"><span className={`badge border text-xs whitespace-nowrap ${ROLES[u.role]?.color}`}>{ROLES[u.role]?.label}</span></td>
                      <td className="px-4 py-3">
                        {isOwner ? <span className="text-xs text-emerald-400">Active</span> : (
                          <button onClick={() => toggleActive(u)} title={u.is_active ? 'Deactivate' : 'Reactivate'}
                            className={`text-xs px-2 py-0.5 rounded-full border ${u.is_active ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' : 'text-white/50 border-white/20 hover:bg-white/5'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isOwner && (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(u)} aria-label="Edit user" className="text-white/30 hover:text-brand-400 transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => setConfirmDelete(u)} aria-label="Delete user" className="text-white/30 hover:text-coral-400 transition-colors"><Trash2 size={14} /></button>
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
      )}

      <div className="glass-card p-4 text-xs text-white/50 space-y-1">
        <p><span className="text-brand-300 font-semibold">Administrator</span> — can add, edit and delete transactions, budgets and categories and view reports, but cannot manage users.</p>
        <p><span className="text-amber-400 font-semibold">Employee</span> — read-only access to the dashboard and the transaction list.</p>
        <p>Deactivated users can no longer sign in; their past transactions are kept.</p>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative glass-card w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit User' : 'Add User'}</h2>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white" aria-label="Close"><X size={20} /></button>
            </div>
            {error && <p className="text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Full Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Fatima Hassan" className="input-field" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@company.bh" className="input-field" />
              </div>
              {!editing && (
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Temporary Password *</label>
                  <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="At least 6 characters" className="input-field" autoComplete="off" />
                </div>
              )}
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-field">
                  <option value="admin">{ROLES.admin.label}</option>
                  <option value="employee">{ROLES.employee.label}</option>
                </select>
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                  Account is active
                </label>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                  <Save size={15} />{saving ? 'Saving…' : editing ? 'Update' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Delete user?"
          message={`${confirmDelete.name} will be permanently removed. Their past transactions are kept. To only block access, deactivate the account instead.`}
          onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete)} />
      )}
    </div>
  );
}
