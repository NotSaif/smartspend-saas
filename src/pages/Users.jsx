import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, Users as UsersIcon, ShieldCheck, Eye } from 'lucide-react';
import { PageHeader, Modal, FormError } from '../components/ui';
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
      <PageHeader kicker="Team" title="User Management" subtitle={`${users.length} users in ${currentUser?.companyName}`}>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} />Add User</button>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/40">Loading…</div>
      ) : (
        <div className="glass-card overflow-hidden animate-rise">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-4 font-semibold ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isOwner = u.role === 'owner';
                  return (
                    <tr key={u.id} className={`table-row ${u.is_active ? '' : 'opacity-50'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-xs font-bold shadow-glow">{u.avatar}</div>
                          <span className="font-medium text-white whitespace-nowrap">{u.name}{u.id === currentUser?.id && <span className="text-white/30 font-normal"> (you)</span>}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white/50">{u.email}</td>
                      <td className="px-5 py-3.5"><span className={`chip whitespace-nowrap ${ROLES[u.role]?.color}`}>{ROLES[u.role]?.label}</span></td>
                      <td className="px-5 py-3.5">
                        {isOwner ? <span className="chip border-emerald-400/30 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Active</span> : (
                          <button onClick={() => toggleActive(u)} title={u.is_active ? 'Deactivate' : 'Reactivate'}
                            className={`chip transition-colors ${u.is_active ? 'border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10' : 'border-white/20 text-white/50 hover:bg-white/5'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-white/40'}`} />{u.is_active ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!isOwner && (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(u)} aria-label="Edit user" className="btn-icon hover:!text-brand-300"><Edit2 size={14} /></button>
                            <button onClick={() => setConfirmDelete(u)} aria-label="Delete user" className="btn-icon hover:!text-coral-400"><Trash2 size={14} /></button>
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { icon: ShieldCheck, c: 'bg-brand-500/20 text-brand-200', t: 'Administrator', d: 'Can add, edit and delete transactions, budgets and categories and view reports, but cannot manage users.' },
          { icon: Eye, c: 'bg-amber-500/15 text-amber-300', t: 'Employee', d: 'Read-only access to the dashboard and the transaction list.' },
          { icon: UsersIcon, c: 'bg-white/[0.06] text-white/60', t: 'Deactivated users', d: 'Can no longer sign in; their past transactions are kept.' },
        ].map(({ icon: Icon, c, t, d }) => (
          <div key={t} className="glass-card flex gap-3 !rounded-2xl p-4">
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${c}`}><Icon size={16} /></span>
            <p className="text-xs leading-relaxed text-white/50"><span className="block text-sm font-semibold text-white">{t}</span>{d}</p>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit User' : 'Add User'} icon={UsersIcon} onClose={() => setModal(false)}>
            <FormError>{error}</FormError>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Jordan Lee" className="input-field" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@company.bh" className="input-field" />
              </div>
              {!editing && (
                <div>
                  <label className="label">Temporary Password *</label>
                  <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="At least 6 characters" className="input-field" autoComplete="off" />
                </div>
              )}
              <div>
                <label className="label">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-field">
                  <option value="admin">{ROLES.admin.label}</option>
                  <option value="employee">{ROLES.employee.label}</option>
                </select>
              </div>
              {editing && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-2xl bg-white/[0.04] p-3 text-sm text-white/75 ring-1 ring-inset ring-white/[0.06]">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                  Account is active
                </label>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  <Save size={15} />{saving ? 'Saving…' : editing ? 'Update' : 'Add User'}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Delete user?"
          message={`${confirmDelete.name} will be permanently removed. Their past transactions are kept. To only block access, deactivate the account instead.`}
          onCancel={() => setConfirmDelete(null)} onConfirm={() => handleDelete(confirmDelete)} />
      )}
    </div>
  );
}
