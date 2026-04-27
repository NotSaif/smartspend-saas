import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Building2, LogOut, Key, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { ROLES } from '../data/mockData';
import { authAPI } from '../services/api';
import { toast } from '../components/Toast';

export default function Profile() {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  // Sync form when currentUser loads (async JWT verification)
  useEffect(() => {
    if (currentUser) {
      setForm({ name: currentUser.name || '', email: currentUser.email || '' });
    }
  }, [currentUser?.id]);

  const [pwForm, setPwForm]   = useState({ current: '', newPass: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone]   = useState(false);

  const roleInfo = ROLES[currentUser?.role] || {};

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form.name, form.email);
      updateCurrentUser(res.user);
      setSaved(true);
      toast.success('Profile saved!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPass !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPass.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword(pwForm.current, pwForm.newPass);
      setPwDone(true);
      setPwForm({ current: '', newPass: '', confirm: '' });
      toast.success('Password updated successfully!');
      setTimeout(() => setPwDone(false), 4000);
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile &amp; Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Avatar card */}
      <div className="glass-card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {currentUser?.avatar || currentUser?.name?.slice(0,2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{currentUser?.name}</h2>
          <p className="text-white/40 text-sm">{currentUser?.email}</p>
          <span className={`badge border text-xs mt-2 inline-block ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Shield,    label: 'Role',    value: roleInfo.label || currentUser?.role },
          { icon: Building2, label: 'Company', value: currentUser?.companyId ? `Company #${currentUser.companyId}` : 'All Companies' },
          { icon: User,      label: 'User ID', value: `#${currentUser?.id}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center flex-shrink-0">
              <Icon size={17} />
            </div>
            <div>
              <p className="text-xs text-white/30">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <User size={16} className="text-brand-400" /> Account Details
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field pl-9" required />
            </div>
          </div>
          {saveError && (
            <div className="flex items-center gap-2 text-coral-400 text-sm p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">
              <AlertCircle size={14}/> {saveError}
            </div>
          )}
          <div className="pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password — real API */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Key size={16} className="text-brand-400" /> Change Password
        </h2>
        {pwError && (
          <div className="flex items-center gap-2 text-coral-400 text-sm mb-4 p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">
            <AlertCircle size={14} /> {pwError}
          </div>
        )}
        {pwDone && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle size={14} /> Password updated successfully!
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Current Password</label>
            <input
              type="password" value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              placeholder="Your current password" className="input-field" required
            />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">New Password</label>
            <input
              type="password" value={pwForm.newPass}
              onChange={e => setPwForm(p => ({ ...p, newPass: e.target.value }))}
              placeholder="At least 6 characters" className="input-field" required
            />
          </div>
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Confirm New Password</label>
            <input
              type="password" value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password" className="input-field" required
            />
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary flex items-center gap-2">
            <Key size={15} /> {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="glass-card p-6 border-coral-500/20">
        <h2 className="text-base font-semibold text-coral-400 mb-3">Sign Out</h2>
        <p className="text-sm text-white/40 mb-4">You will be returned to the landing page.</p>
        <button onClick={handleLogout} className="btn-danger flex items-center gap-2">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
