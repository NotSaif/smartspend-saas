import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_ACCOUNTS, DEMO_COMPANY, DEMO_OTHER_ACCOUNT } from '../data/constants';
import { AuroraBackground, Logo } from '../components/ui';
import { Eye, EyeOff, LogIn, ArrowLeft, Building2, AlertTriangle, ScanLine, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

const demoColors = {
  emerald: 'border-emerald-400/25 hover:bg-emerald-500/10 text-emerald-300',
  brand:   'border-brand-400/30 hover:bg-brand-500/10 text-brand-300',
  amber:   'border-amber-400/25 hover:bg-amber-500/10 text-amber-300',
  cyan:    'border-cyan-400/30 hover:bg-cyan-500/10 text-cyan-300',
};

const highlights = [
  { icon: AlertTriangle, title: 'Anomaly detection', desc: 'Unusual expenses flagged by a z-score engine.', c: 'text-amber-300 bg-amber-500/15' },
  { icon: ScanLine,      title: 'Receipt scanning',  desc: 'Vendor, total and date read from a photo.',   c: 'text-cyan-300 bg-cyan-500/15' },
  { icon: ShieldCheck,   title: 'Private by design', desc: 'Each company\'s data is fully isolated.',     c: 'text-emerald-300 bg-emerald-500/15' },
];

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
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <AuroraBackground intensity="strong" />

      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] p-12 lg:flex">
        <Link to="/"><Logo size={40} /></Link>
        <div className="max-w-md">
          <span className="chip border-white/10 bg-white/[0.05] text-white/70"><Sparkles size={13} className="text-brand-300" /> SME finance, reimagined</span>
          <h2 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
            Know where every <span className="text-gradient-animated">dinar</span> goes.
          </h2>
          <p className="mt-4 text-white/50">Track income and expenses, set budgets and let SmartSpend point out what needs your attention.</p>
          <div className="mt-10 space-y-3">
            {highlights.map(({ icon: Icon, title, desc, c }, i) => (
              <div key={title} className="glass-card flex items-center gap-4 !rounded-2xl p-4 animate-rise" style={{ animationDelay: `${120 + i * 90}ms` }}>
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${c}`}><Icon size={18} /></span>
                <div><p className="text-sm font-semibold text-white">{title}</p><p className="text-xs text-white/45">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/30">SmartSpend · SME Financial Management · Bahrain 🇧🇭</p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md py-8 animate-rise">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="mb-6 lg:hidden"><Logo size={40} /></div>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">{isRegister ? 'Register your company' : 'Welcome back'}</h1>
          <p className="mb-8 mt-2 text-sm text-white/45">
            {isRegister ? 'Create a SmartSpend account for your business' : 'Sign in to SmartSpend'}
          </p>

          <div className="glass-strong glow-border p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-2xl border border-coral-500/25 bg-coral-500/10 px-4 py-3 text-sm text-coral-300 animate-pop">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="label">Company Name *</label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input value={form.companyName} onChange={set('companyName')} placeholder="e.g. Sunrise Bakery" className="input-field pl-10" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label">Industry</label>
                      <input value={form.industry} onChange={set('industry')} placeholder="e.g. Food & Beverage" className="input-field" />
                    </div>
                    <div>
                      <label className="label">Your Full Name *</label>
                      <input value={form.name} onChange={set('name')} placeholder="e.g. Emma Brooks" className="input-field" autoComplete="name" required />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="label">Email Address{isRegister && ' *'}</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.bh"
                  className="input-field" autoComplete="email" required />
              </div>
              <div>
                <label className="label">Password{isRegister && ' *'}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder={isRegister ? 'At least 6 characters' : '••••••••'} className="input-field pr-11"
                    autoComplete={isRegister ? 'new-password' : 'current-password'} required />
                  <button type="button" onClick={() => setShowPass(p => !p)} aria-label="Show password"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 transition-colors hover:text-white">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {isRegister && (
                <div>
                  <label className="label">Confirm Password *</label>
                  <input type={showPass ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')}
                    placeholder="Repeat password" className="input-field" autoComplete="new-password" required />
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-3.5">
                {loading
                  ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : isRegister ? <><Building2 size={16} /> Create Account</> : <><LogIn size={16} /> Sign In</>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/45">
              {isRegister
                ? <>Already have an account? <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">Sign in</Link></>
                : <>New to SmartSpend? <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">Register your company</Link></>}
            </p>

            {!isRegister && (
              <div className="mt-6 border-t border-white/[0.06] pt-6">
                <p className="mb-3 text-center text-xs text-white/35">Quick demo access — click a user to fill in their login</p>

                <p className="kicker mb-2 flex items-center gap-1.5 !text-[10px]"><Building2 size={12} /> {DEMO_COMPANY}</p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_ACCOUNTS.map(({ name, role, label, email, password, color }) => (
                    <button key={label} type="button" onClick={() => quickFill(email, password)} title={`${name} — ${role}`}
                      className={`rounded-xl border bg-white/[0.03] px-2 py-2.5 text-center transition-all ${demoColors[color]}`}>
                      <span className="block text-xs font-bold">{label}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/55">{name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                  <span className="h-px flex-1 bg-white/10" /> Another company <span className="h-px flex-1 bg-white/10" />
                </div>
                <button type="button" onClick={() => quickFill(DEMO_OTHER_ACCOUNT.email, DEMO_OTHER_ACCOUNT.password)}
                  className={`flex w-full items-center gap-3 rounded-xl border bg-white/[0.03] px-3 py-2.5 text-left transition-all ${demoColors[DEMO_OTHER_ACCOUNT.color]}`}>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/15"><Building2 size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold">{DEMO_OTHER_ACCOUNT.company}</span>
                    <span className="block truncate text-[11px] text-white/55">{DEMO_OTHER_ACCOUNT.name} · {DEMO_OTHER_ACCOUNT.role}</span>
                  </span>
                  <ArrowRight size={14} className="flex-shrink-0 opacity-60" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
