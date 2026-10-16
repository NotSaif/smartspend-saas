import { useNavigate } from 'react-router-dom';
import { TrendingUp, BarChart3, Shield, ScanLine, AlertTriangle, Building2, ArrowRight } from 'lucide-react';
import { DEMO_ACCOUNTS } from '../data/constants';

const features = [
  { icon: BarChart3,     title: 'Real-Time Dashboard',  desc: 'Income, expenses, net balance and budget health at a glance, with interactive charts.' },
  { icon: AlertTriangle, title: 'Anomaly Detection',    desc: 'A statistical z-score engine automatically flags expenses that are unusually high for their category.' },
  { icon: ScanLine,      title: 'Receipt Scanning',     desc: 'Upload a receipt photo and SmartSpend reads the vendor, total and date for you (OCR).' },
  { icon: TrendingUp,    title: 'Budget Alerts',        desc: 'Set monthly limits per category and get alerted when spending reaches 90% of the limit.' },
  { icon: Shield,        title: 'Role-Based Access',    desc: 'Business Owner, Administrator and read-only Employee roles, enforced on every request.' },
  { icon: Building2,     title: 'Private Company Data', desc: 'Every company is a separate tenant: its data is never visible to other businesses. Export reports to CSV.' },
];

const stats = [
  { value: '18,000+', label: 'SMEs in Bahrain', sub: 'Supported by Tamkeen' },
  { value: 'BHD',     label: 'Native Currency', sub: 'Bahraini Dinar precision' },
  { value: '100%',    label: 'Digital Tracking', sub: 'Replace paper & Excel' },
  { value: '2030',    label: 'Vision Aligned',   sub: 'Bahrain financial inclusion' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-white/5 backdrop-blur-sm sticky top-0 z-40 bg-navy-900/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">SmartSpend</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-ghost text-sm">Sign In</button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm">Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 sm:px-8 pt-16 sm:pt-24 pb-20 text-center max-w-5xl mx-auto">
        {/* Background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 mb-6">
            🇧🇭 Built for Bahrain's SME Sector · Vision 2030 Aligned
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            Financial Clarity for<br />
            <span className="text-gradient">Growing Businesses</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartSpend replaces spreadsheets and paper records with a real-time digital financial management system designed for SMEs in Bahrain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-base px-8 py-3 flex items-center justify-center gap-2 glow-blue"
            >
              Register Your Company <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost text-base px-8 py-3"
            >
              Try the Demo →
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 mb-20">
        <div className="glass-card grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/5">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="p-6 text-center">
              <p className="text-3xl font-extrabold text-gradient mb-1">{value}</p>
              <p className="text-sm font-semibold text-white/80">{label}</p>
              <p className="text-xs text-white/30 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything You Need</h2>
          <p className="text-white/40">A complete financial management suite built for real SME workflows</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 hover:border-brand-500/30 transition-all duration-300 group">
              <div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-4 group-hover:bg-brand-500/25 transition-colors">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Credentials */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 mb-20">
        <div className="glass-card p-8 border-brand-500/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Try the Demo</h2>
          <p className="text-white/40 mb-6 text-sm">Explore the demo company Al-Zain Trading Co. with each access level</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mb-8">
            {DEMO_ACCOUNTS.map(c => (
              <div key={c.role} className={`rounded-xl border p-4 ${{ emerald: 'border-emerald-500/30 bg-emerald-500/5', brand: 'border-brand-500/30 bg-brand-500/5', amber: 'border-amber-500/30 bg-amber-500/5' }[c.color]}`}>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wide mb-2">{c.role}</p>
                <p className="text-xs text-white/70 font-mono mb-1 break-all">{c.email}</p>
                <p className="text-xs text-white/50 font-mono">{c.password}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary px-8 py-3">
            Go to Login →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6 text-center text-white/20 text-xs">
        <p>© 2026 SmartSpend — A Financial Management System for SMEs in Bahrain · Built for IT Graduation Project</p>
      </footer>
    </div>
  );
}
