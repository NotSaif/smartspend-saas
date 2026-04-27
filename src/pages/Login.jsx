import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const quickFill = (e, p) => { setEmail(e); setPassword(p); setError(''); };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.success) navigate('/dashboard');
      else setError(result.error || 'Invalid email or password.');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      {/* BG glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors group">
            <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center mb-4 glow-blue hover:scale-105 transition-transform cursor-pointer">
              <TrendingUp size={28} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to SmartSpend</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl border border-coral-500/30 bg-coral-500/10 text-coral-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Email Address</label>
              <input
                id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.bh" className="input-field" autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input-field pr-10" autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>

          {/* Quick fill demo */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-white/30 mb-3 text-center">Quick demo access</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Owner',    e: 'owner@alzain.bh',      p: 'owner123', c: 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400' },
                { label: 'Admin',    e: 'admin@smartspend.bh',  p: 'admin123', c: 'border-brand-500/30 hover:bg-brand-500/10 text-brand-400' },
                { label: 'Employee', e: 'accountant@alzain.bh', p: 'emp123',   c: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400' },
              ].map(({ label, e, p, c }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => quickFill(e, p)}
                  className={`text-xs py-2 px-3 rounded-lg border bg-white/3 transition-all ${c}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          SmartSpend · SME Financial Management · Bahrain 🇧🇭
        </p>
      </div>
    </div>
  );
}
