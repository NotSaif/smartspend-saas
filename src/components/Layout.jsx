import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ROLES } from '../data/constants';
import { AuroraBackground, Logo } from './ui';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, BarChart3,
  Tags, Users, LogOut, Menu, X, UserCircle, RefreshCw, AlertCircle, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const navGroups = [
  { label: 'Overview', items: [
    { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, roles: ['owner', 'admin', 'employee'] },
    { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight,  roles: ['owner', 'admin', 'employee'] },
  ] },
  { label: 'Planning', items: [
    { to: '/budgets',    label: 'Budgets',    icon: PieChart,  roles: ['owner', 'admin'] },
    { to: '/reports',    label: 'Reports',    icon: BarChart3, roles: ['owner', 'admin'] },
    { to: '/categories', label: 'Categories', icon: Tags,      roles: ['owner', 'admin'] },
  ] },
  { label: 'Account', items: [
    { to: '/users',   label: 'Users',      icon: Users,      roles: ['owner'] },
    { to: '/profile', label: 'My Profile', icon: UserCircle, roles: ['owner', 'admin', 'employee'] },
  ] },
];

const isWide = () => window.innerWidth >= 1024;
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  const { loadError, reload, loading } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(isWide()); // mobile drawer open / desktop sidebar expanded
  const role = currentUser?.role;
  const roleInfo = ROLES[role];
  const firstName = currentUser?.name?.split(' ')[0];

  const handleLogout = () => { logout(); navigate('/'); };
  // On phones and tablets the menu closes after a page is chosen
  const closeOnMobile = () => { if (!isWide()) setOpen(false); };

  return (
    <div className="relative flex h-screen overflow-hidden">
      <AuroraBackground />

      {open && <div className="fixed inset-0 z-30 bg-navy-950/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar — a floating glass panel */}
      <aside className={`fixed inset-y-0 left-0 z-40 p-3 transition-all duration-300 lg:static lg:translate-x-0
        ${open ? 'w-[17.5rem] translate-x-0' : 'w-[17.5rem] -translate-x-full lg:w-[5.75rem]'}`}>
        <div className="glass-strong flex h-full flex-col overflow-hidden !rounded-[1.75rem]">
          <div className={`flex items-center border-b border-white/[0.06] px-4 py-5 ${open ? 'justify-between' : 'justify-center'}`}>
            {open ? <Logo size={38} subtitle={currentUser?.companyName} /> : <Logo size={38} withText={false} />}
            {open && (
              <button onClick={() => setOpen(false)} className="btn-icon lg:hidden" aria-label="Close menu"><X size={18} /></button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map(group => {
              const items = group.items.filter(i => i.roles.includes(role));
              if (!items.length) return null;
              return (
                <div key={group.label} className="mb-5">
                  {open ? <p className="kicker mb-2 px-3.5 !text-[10px]">{group.label}</p> : <div className="mx-auto mb-2 h-px w-8 bg-white/10" />}
                  <div className="space-y-1">
                    {items.map(({ to, label, icon: Icon }) => (
                      <NavLink key={to} to={to} onClick={closeOnMobile} title={!open ? label : undefined}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${!open ? 'justify-center !px-0' : ''}`}>
                        <Icon size={19} strokeWidth={2} className="flex-shrink-0" />
                        {open && <span>{label}</span>}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-white/[0.06] p-3">
            {open ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.06]">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-xs font-bold shadow-glow">
                  {currentUser?.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{currentUser?.name}</p>
                  <span className={`chip mt-0.5 !py-0 !text-[10px] ${roleInfo?.color}`}>{roleInfo?.label}</span>
                </div>
                <button onClick={handleLogout} className="btn-icon hover:!text-coral-400" title="Sign out" aria-label="Sign out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={handleLogout} className="btn-icon mx-auto flex h-11 w-11 hover:!text-coral-400" title="Sign out" aria-label="Sign out">
                <LogOut size={19} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center gap-3 px-4 pb-2 pt-4 sm:px-6 lg:px-8 lg:pt-6">
          <button onClick={() => setOpen(p => !p)} className="btn-icon h-10 w-10 border border-white/10 bg-white/[0.04]" aria-label="Toggle menu">
            <span className="lg:hidden">{open ? <X size={18} /> : <Menu size={18} />}</span>
            <span className="hidden lg:inline">{open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs text-white/45">{greeting()},</p>
            <p className="truncate font-display text-base font-bold leading-tight text-white">{firstName} 👋</p>
          </div>
          <div className="flex-1" />
          <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white/55 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">
            {loadError ? (
              <div className="glass-card mx-auto mt-10 max-w-lg p-8 text-center animate-pop">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-500/15 text-coral-400 ring-1 ring-inset ring-coral-500/25">
                  <AlertCircle size={26} />
                </div>
                <h2 className="font-display text-lg font-bold text-white">Could not load your data</h2>
                <p className="mb-6 mt-1 text-sm text-white/50">{loadError}</p>
                <button onClick={reload} disabled={loading} className="btn-primary">
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Try again
                </button>
              </div>
            ) : children}
          </div>
        </main>
      </div>
    </div>
  );
}
