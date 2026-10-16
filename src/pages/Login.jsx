import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS } from '../data/constants';
import { TrendingUp, Eye, EyeOff, LogIn, ArrowLeft, Building2 } from 'lucide-react';

const demoColors = {
  emerald: 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400',
  brand:   'border-brand-500/30 hover:bg-brand-500/10 text-brand-400',
  amber:   'border-amber-500/30 hover:bg-amber-500/10 text-amber-400',
};

export default function Login({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', industry: '', name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const quickFill = (email, password) => { setForm(p => ({ ...p, email, password })); setError(''); };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (isRegister) {
      if (!form.companyName.trim() || !form.name.trim()) return setError('Please fill in all required fields.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
    }
    setLoading(true);
    const result = isRegister
      ? await register({ companyName: form.companyName, industry: form.industry, name: form.name, email: form.email, password: form.password })
      : await login(form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-6">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center mb-4 glow-blue">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{isRegister ? 'Register your company' : 'Welcome back'}</h1>
          <p className="text-white/40 text-sm mt-1">
            {isRegister ? 'Create a SmartSpend account for your business' : 'Sign in to SmartSpend'}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl border border-coral-500/30 bg-coral-500/10 text-coral-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Company Name *</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={form.companyName} onChange={set('companyName')} placeholder="e.g. Al-Noor Bakery" className="input-field pl-9" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Industry</label>
                  <input value={form.industry} onChange={set('industry')} placeholder="e.g. Food & Beverage" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block">Your Full Name *</label>
                  <input value={form.name} onChange={set('name')} placeholder="e.g. Mona Ali" className="input-field" autoComplete="name" required />
                </div>
              </>
            )}
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Email Address{isRegister && ' *'}</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.bh"
                className="input-field" autoComplete="email" required />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Password{isRegister && ' *'}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder={isRegister ? 'At least 6 characters' : '••••••••'} className="input-field pr-10"
                  autoComplete={isRegister ? 'new-password' : 'current-password'} required />
                <button type="button" onClick={() => setShowPass(p => !p)} aria-label="Show password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {isRegister && (
              <div>
                <label className="text-sm text-white/60 mb-1.5 block">Confirm Password *</label>
                <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')}
                  placeholder="Repeat password" className="input-field" autoComplete="new-password" required />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : isRegister ? <><Building2 size={16} /> Create Account</> : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-5">
            {isRegister
              ? <>Already have an account? <Link to="/login" className="text-brand-300 hover:text-brand-400 font-medium">Sign in</Link></>
              : <>New to SmartSpend? <Link to="/register" className="text-brand-300 hover:text-brand-400 font-medium">Register your company</Link></>}
          </p>

          {!isRegister && (
            <div className="mt-5 pt-5 border-t border-white/5">
              <p className="text-xs text-white/30 mb-3 text-center">Quick demo access — Al-Zain Trading Co.</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map(({ label, email, password, color }) => (
                  <button key={label} type="button" onClick={() => quickFill(email, password)}
                    className={`text-xs py-2 px-3 rounded-lg border bg-white/3 transition-all ${demoColors[color]}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6">SmartSpend · SME Financial Management · Bahrain 🇧🇭</p>
      </div>
    </div>
  );
}
