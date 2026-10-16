import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Building2, LogOut, Key, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { ROLES } from '../data/constants';
import { authAPI, companyAPI } from '../services/api';
import { PageHeader } from '../components/ui';
import { toast } from '../components/Toast';

export default function Profile() {
  const { currentUser, logout, updateCurrentUser, isOwner } = useAuth();
  const [company, setCompany] = useState({ name: '', industry: '', location: '' });
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState('');

  useEffect(() => {
    companyAPI.get()
      .then(res => setCompany({ name: res.data.name || '', industry: res.data.industry || '', location: res.data.location || '' }))
      .catch(() => {});
  }, []);

  const handleCompanySave = async (e) => {
    e.preventDefault();
    setCompanyError('');
    setCompanySaving(true);
    try {
      const res = await companyAPI.update(company);
      updateCurrentUser({ companyName: res.data.name });
      toast.success('Company profile saved.');
    } catch (err) {
      setCompanyError(err.message);
    } finally {
      setCompanySaving(false);
    }
  };
  const navigate = useNavigate();
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState(() => ({ name: currentUser?.name || '', email: currentUser?.email || '' }));

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
    <div className="max-w-3xl space-y-6">
      <PageHeader kicker="Account" title="Profile & Settings" subtitle="Manage your account information" />

      {/* Identity card */}
      <div className="glass-card glow-border relative flex items-center gap-5 overflow-hidden p-6 animate-rise">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-cyan-500 font-display text-2xl font-extrabold text-white shadow-glow">
          {currentUser?.avatar || currentUser?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="relative min-w-0">
          <h2 className="truncate font-display text-2xl font-bold text-white">{currentUser?.name}</h2>
          <p className="truncate text-sm text-white/45">{currentUser?.email}</p>
          <span className={`chip mt-2 ${roleInfo.color}`}>{roleInfo.label}</span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Shield,    label: 'Role',    value: roleInfo.label || currentUser?.role },
          { icon: Building2, label: 'Company', value: currentUser?.companyName },
          { icon: Mail,      label: 'Email',   value: currentUser?.email },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-cyan-500/10 text-brand-200 ring-1 ring-inset ring-white/10">
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/40">{label}</p>
              <p className="text-sm font-semibold text-white truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="glass-card p-6 animate-rise">
        <h2 className="section-title mb-5 flex items-center gap-2">
          <User size={16} className="text-brand-300" /> Account Details
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field pl-10" required />
            </div>
          </div>
          {saveError && (
            <div className="flex items-center gap-2 text-coral-400 text-sm p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">
              <AlertCircle size={14}/> {saveError}
            </div>
          )}
          <div className="pt-1">
            <button type="submit" disabled={saving} className="btn-primary">
              {saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Company profile (UR-02) — editable by the Business Owner */}
      <div className="glass-card p-6 animate-rise">
        <h2 className="section-title mb-1 flex items-center gap-2">
          <Building2 size={16} className="text-brand-300" /> Company Profile
        </h2>
        <p className="text-xs text-white/40 mb-5">{isOwner ? 'Shown across SmartSpend for everyone in your company.' : 'Only the Business Owner can change these details.'}</p>
        <form onSubmit={handleCompanySave} className="space-y-4">
          <div>
            <label className="label">Company Name</label>
            <input value={company.name} disabled={!isOwner} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} className="input-field disabled:opacity-60" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Industry</label>
              <input value={company.industry} disabled={!isOwner} onChange={e => setCompany(p => ({ ...p, industry: e.target.value }))} className="input-field disabled:opacity-60" />
            </div>
            <div>
              <label className="label">Location</label>
              <input value={company.location} disabled={!isOwner} onChange={e => setCompany(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Manama, Bahrain" className="input-field disabled:opacity-60" />
            </div>
          </div>
          {companyError && (
            <div className="flex items-center gap-2 text-coral-400 text-sm p-3 bg-coral-500/10 rounded-xl border border-coral-500/20">
              <AlertCircle size={14} /> {companyError}
            </div>
          )}
          {isOwner && (
            <button type="submit" disabled={companySaving} className="btn-primary">
              <Save size={15} /> {companySaving ? 'Saving…' : 'Save Company'}
            </button>
          )}
        </form>
      </div>

      {/* Change password — real API */}
      <div className="glass-card p-6 animate-rise">
        <h2 className="section-title mb-5 flex items-center gap-2">
          <Key size={16} className="text-brand-300" /> Change Password
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
            <label className="label">Current Password</label>
            <input
              type="password" value={pwForm.current}
              onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              placeholder="Your current password" className="input-field" required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password" value={pwForm.newPass}
              onChange={e => setPwForm(p => ({ ...p, newPass: e.target.value }))}
              placeholder="At least 6 characters" className="input-field" required
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password" value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password" className="input-field" required
            />
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary">
            <Key size={15} /> {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Sign out */}
      <div className="glass-card !border-coral-500/20 p-6 animate-rise">
        <h2 className="section-title mb-2 !text-coral-300">Sign Out</h2>
        <p className="text-sm text-white/40 mb-4">You will be returned to the landing page.</p>
        <button onClick={handleLogout} className="btn-danger">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
