import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Shield, ScanLine, AlertTriangle, Building2, TrendingUp,
  Sparkles, CheckCircle2, FileSpreadsheet, Bell, UserPlus, Receipt,
} from 'lucide-react';
import { DEMO_ACCOUNTS } from '../data/constants';
import { AuroraBackground, Logo } from '../components/ui';

const stats = [
  { value: '18,000+', label: 'SMEs in Bahrain', sub: 'Supported by Tamkeen' },
  { value: 'BHD',     label: 'Native Currency', sub: 'Bahraini Dinar precision' },
  { value: '100%',    label: 'Digital Tracking', sub: 'Replace paper & Excel' },
  { value: '2030',    label: 'Vision Aligned',   sub: 'Bahrain financial inclusion' },
];

const features = [
  { icon: BarChart3,  title: 'Real-Time Dashboard', desc: 'Income, expenses, net balance and budget health at a glance, with interactive charts.', tint: 'from-brand-500/25 to-brand-500/0 text-brand-300' },
  { icon: TrendingUp, title: 'Budget Alerts',       desc: 'Set monthly limits per category and get alerted when spending reaches 90% of the limit.', tint: 'from-emerald-500/25 to-emerald-500/0 text-emerald-300' },
  { icon: Shield,     title: 'Role-Based Access',   desc: 'Business Owner, Administrator and read-only Employee roles, enforced on every request.', tint: 'from-cyan-500/25 to-cyan-500/0 text-cyan-300' },
  { icon: Building2,  title: 'Private Company Data', desc: 'Every company is a separate tenant: its data is never visible to other businesses.', tint: 'from-coral-500/25 to-coral-500/0 text-coral-300' },
];

const demoTint = {
  emerald: 'from-emerald-500/20 border-emerald-400/25 text-emerald-300',
  brand:   'from-brand-500/25 border-brand-400/30 text-brand-300',
  amber:   'from-amber-500/20 border-amber-400/25 text-amber-300',
};

/* ── A miniature, purely decorative dashboard used as the hero visual ── */
function ProductPreview() {
  const bars = [[62, 38], [70, 45], [58, 41], [76, 82]];
  return (
    <div className="relative mx-auto mt-16 w-full max-w-5xl [perspective:2000px]">
      <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-gradient-to-b from-brand-500/25 via-cyan-500/10 to-transparent blur-3xl" />
      <div className="glass-strong glow-border relative overflow-hidden !rounded-[2rem] p-3 shadow-[0_40px_120px_-30px_rgba(124,92,255,0.6)] [transform:rotateX(7deg)] origin-top">
        <div className="flex items-center gap-1.5 px-2 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-coral-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 rounded-lg bg-white/[0.05] px-3 py-1 text-[10px] text-white/40">smartspend.app/dashboard</span>
        </div>
        <div className="grid grid-cols-12 gap-3 rounded-[1.5rem] bg-navy-950/60 p-4 text-left">
          <div className="col-span-3 hidden space-y-2 sm:block">
            <Logo size={26} />
            <div className="pt-3 space-y-1.5">
              {['Dashboard', 'Transactions', 'Budgets', 'Reports', 'Categories'].map((n, i) => (
                <div key={n} className={`rounded-xl px-3 py-2 text-[11px] ${i === 0 ? 'bg-gradient-to-r from-brand-500/30 to-transparent text-white' : 'text-white/40'}`}>{n}</div>
              ))}
            </div>
          </div>
          <div className="col-span-12 space-y-3 sm:col-span-9">
            <div className="grid grid-cols-3 gap-3">
              {[['Total Income', 'BHD 7,650.000', 'text-emerald-300'], ['Total Expenses', 'BHD 8,011.250', 'text-coral-300'], ['Budget Utilised', '173%', 'text-amber-300']].map(([l, v, c]) => (
                <div key={l} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-white/40">{l}</p>
                  <p className={`mt-1 text-xs font-bold sm:text-sm ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <p className="mb-3 text-[10px] text-white/40">Income vs Expenses</p>
                <div className="flex h-24 items-end gap-3 px-1">
                  {bars.map(([a, b], i) => (
                    <div key={i} className="flex h-full flex-1 items-end gap-1">
                      <div className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-500/40 to-emerald-400" style={{ height: `${a}%` }} />
                      <div className="flex-1 rounded-t-md bg-gradient-to-t from-coral-500/40 to-coral-400" style={{ height: `${b}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="h-24 w-24 flex-shrink-0 rounded-full" style={{ background: 'conic-gradient(#9B83FF 0 30%, #22D3EE 30% 52%, #34D399 52% 70%, #FB7185 70% 86%, #FBBF24 86% 100%)', WebkitMask: 'radial-gradient(circle, transparent 52%, #000 53%)', mask: 'radial-gradient(circle, transparent 52%, #000 53%)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating callouts */}
      <div className="glass-strong absolute -left-10 top-[58%] hidden w-60 items-center gap-3 !rounded-2xl p-3.5 text-left shadow-glow md:flex animate-float">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 animate-pulse-ring"><AlertTriangle size={17} /></span>
        <div><p className="text-xs font-semibold text-white">Anomaly detected</p><p className="text-[11px] text-white/50">Van repair · z = 2.67</p></div>
      </div>
      <div className="glass-strong absolute -right-10 -bottom-6 hidden w-60 items-center gap-3 !rounded-2xl p-3.5 text-left shadow-glow-cyan md:flex animate-float [animation-delay:-3s]">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300"><ScanLine size={17} /></span>
        <div><p className="text-xs font-semibold text-white">Receipt scanned</p><p className="text-[11px] text-white/50">City Supermarket · BHD 18.750</p></div>
      </div>
    </div>
  );
}

/* Small bell curve with the z = 2 threshold, for the anomaly feature tile */
function BellCurve() {
  return (
    <svg viewBox="0 0 300 110" className="mt-6 w-full" aria-hidden>
      <defs>
        <linearGradient id="bell" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9B83FF" stopOpacity=".55" /><stop offset="1" stopColor="#9B83FF" stopOpacity="0" /></linearGradient>
      </defs>
      <path d="M0 100 C 60 100, 90 10, 150 10 S 240 100, 300 100 Z" fill="url(#bell)" />
      <path d="M0 100 C 60 100, 90 10, 150 10 S 240 100, 300 100" fill="none" stroke="#C0B2FF" strokeWidth="2" />
      <line x1="232" y1="8" x2="232" y2="104" stroke="#FBBF24" strokeDasharray="4 4" strokeWidth="1.5" />
      <text x="238" y="22" fill="#FCD34D" fontSize="11" fontFamily="Plus Jakarta Sans">z = 2</text>
      <circle cx="268" cy="95" r="6" fill="#FBBF24"><animate attributeName="r" values="5;8;5" dur="1.8s" repeatCount="indefinite" /></circle>
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AuroraBackground intensity="strong" />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-navy-900/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo size={36} />
          <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#demo" className="transition-colors hover:text-white">Demo</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="btn-ghost !py-2 text-sm">Sign In</button>
            <button onClick={() => navigate('/register')} className="btn-primary !py-2 text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
        <span className="chip mx-auto mb-7 border-white/10 bg-white/[0.05] text-white/70 animate-rise">
          <Sparkles size={13} className="text-brand-300" /> Built for Bahrain's SME sector · Vision 2030 aligned
        </span>
        <h1 className="mx-auto max-w-4xl font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl md:text-7xl animate-rise [animation-delay:80ms]">
          Financial clarity for <br className="hidden sm:block" />
          <span className="text-gradient-animated">growing businesses</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg animate-rise [animation-delay:160ms]">
          SmartSpend replaces spreadsheets and paper records with a real-time financial system that scans your receipts,
          watches your budgets and flags unusual spending automatically.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row animate-rise [animation-delay:240ms]">
          <button onClick={() => navigate('/register')} className="btn-primary px-7 py-3.5 text-base">
            Register Your Company <ArrowRight size={18} />
          </button>
          <button onClick={() => navigate('/login')} className="btn-ghost px-7 py-3.5 text-base">
            Try the Demo →
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-white/35 animate-rise [animation-delay:300ms]">
          <CheckCircle2 size={14} className="text-emerald-400" /> Free to start · No installation · BHD 3-decimal precision
        </p>

        <ProductPreview />
      </section>

      {/* Stats */}
      <section className="mx-auto mb-24 max-w-6xl px-4 sm:px-6">
        <div className="glass-card grid grid-cols-2 divide-white/[0.06] md:grid-cols-4 md:divide-x">
          {stats.map(({ value, label, sub }) => (
            <div key={label} className="p-6 text-center">
              <p className="font-display text-3xl font-extrabold text-gradient">{value}</p>
              <p className="mt-1 text-sm font-semibold text-white/80">{label}</p>
              <p className="mt-0.5 text-xs text-white/35">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — bento grid */}
      <section id="features" className="mx-auto mb-28 max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="kicker mb-3">Everything you need</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Built like a finance team in a box</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/45">A complete financial management suite built for real SME workflows.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="glass-card glow-border p-7 md:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/0 text-amber-300 ring-1 ring-inset ring-white/10"><AlertTriangle size={22} /></div>
            <h3 className="mt-5 font-display text-xl font-bold text-white">Anomaly Detection</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">A statistical z-score engine compares every expense with its category history and flags anything more than two standard deviations above normal — automatically.</p>
            <BellCurve />
          </div>
          <div className="glass-card p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-cyan-500/0 text-cyan-300 ring-1 ring-inset ring-white/10"><ScanLine size={22} /></div>
            <h3 className="mt-5 font-display text-xl font-bold text-white">Receipt Scanning</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">Upload a receipt photo and SmartSpend reads the vendor, total and date for you (OCR).</p>
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 font-mono text-[11px] leading-6 text-white/55">
              <p className="text-white/80">CITY SUPERMARKET</p>
              <p>2026-10-12</p>
              <p className="flex justify-between"><span>SUBTOTAL</span><span>17.045</span></p>
              <p className="flex justify-between font-semibold text-cyan-300"><span>TOTAL BHD</span><span>18.750</span></p>
            </div>
          </div>
          {features.map(({ icon: Icon, title, desc, tint }) => (
            <div key={title} className="glass-card group p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/15">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-white/10 ${tint}`}><Icon size={22} /></div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
            </div>
          ))}
          <div className="glass-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 md:col-span-2">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/30 to-cyan-500/10 text-brand-300 ring-1 ring-inset ring-white/10"><FileSpreadsheet size={22} /></div>
                <h3 className="mt-5 font-display text-lg font-bold text-white">Reports you can take anywhere</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">Monthly profit &amp; loss and category breakdowns, exported to CSV for Excel or printed to PDF.</p>
              </div>
              <div className="flex-1 space-y-2">
                {[['July', 'Profit', 'BHD 3,965.750'], ['August', 'Profit', 'BHD 3,823.450'], ['October', 'Loss', 'BHD -380.000']].map(([m, s, v]) => (
                  <div key={m} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-xs">
                    <span className="text-white/70">{m}</span>
                    <span className={`badge ${s === 'Profit' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-coral-500/15 text-coral-300'}`}>{s}</span>
                    <span className="num font-semibold text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto mb-28 max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="kicker mb-3">How it works</p>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Up and running in minutes</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: UserPlus, step: '01', title: 'Register your company', desc: 'Create your company and owner account. Default categories are ready instantly.' },
            { icon: Receipt,  step: '02', title: 'Record or scan',        desc: 'Add income and expenses by hand or scan a receipt — your team works in one place.' },
            { icon: Bell,     step: '03', title: 'Get smart alerts',      desc: 'SmartSpend warns you about unusual expenses and budgets reaching 90%.' },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="glass-card relative overflow-hidden p-7">
              <span className="absolute -right-2 -top-6 font-display text-8xl font-extrabold text-white/[0.04]">{step}</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-glow"><Icon size={19} /></div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto mb-24 max-w-4xl scroll-mt-24 px-4 sm:px-6">
        <div className="glass-card glow-border overflow-hidden p-8 text-center sm:p-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/15 via-transparent to-cyan-500/10" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">Try the Demo</h2>
            <p className="mb-8 mt-2 text-sm text-white/50">Explore the demo company General Trading Co. with each access level</p>
            <div className="mb-8 grid grid-cols-1 gap-3 text-left md:grid-cols-3">
              {DEMO_ACCOUNTS.map(c => (
                <div key={c.role} className={`rounded-2xl border bg-gradient-to-br to-transparent p-4 ${demoTint[c.color]}`}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{c.role}</p>
                  <p className="mt-2 break-all font-mono text-xs text-white/80">{c.email}</p>
                  <p className="font-mono text-xs text-white/50">{c.password}</p>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/login')} className="btn-primary px-8 py-3.5">Go to Login <ArrowRight size={17} /></button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-4 py-8 text-center">
        <div className="mb-3 flex justify-center"><Logo size={28} /></div>
        <p className="text-xs text-white/30">© 2026 SmartSpend — A Financial Management System for SMEs in Bahrain · Built for IT Graduation Project</p>
        <p className="mt-2 text-xs"><Link to="/register" className="text-brand-300 hover:text-brand-200">Register your company</Link></p>
      </footer>
    </div>
  );
}
