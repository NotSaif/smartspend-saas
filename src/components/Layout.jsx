import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, BarChart3,
  Tags, Users, Building2, LogOut, Menu, X, TrendingUp, ChevronRight, UserCircle
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, roles: ['owner','admin','employee'] },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight,  roles: ['owner','admin','employee'] },
  { to: '/budgets',      label: 'Budgets',      icon: PieChart,        roles: ['owner','admin'] },
  { to: '/reports',      label: 'Reports',      icon: BarChart3,       roles: ['owner','admin'] },
  { to: '/categories',   label: 'Categories',   icon: Tags,            roles: ['owner','admin'] },
  { to: '/users',        label: 'Users',        icon: Users,           roles: ['admin'] },
  { to: '/companies',    label: 'Companies',    icon: Building2,       roles: ['admin'] },
  { to: '/profile',      label: 'My Profile',   icon: UserCircle,      roles: ['owner','admin','employee'] },
];

const roleColors = {
  owner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  admin: 'bg-brand-500/20 text-brand-300 border-brand-500/30',
  employee: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function Layout({ children }) {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/'); };

  const allowed = navItems.filter(item => item.roles.includes(currentUser?.role));

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col bg-navy-800 border-r border-white/5 transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-white leading-tight">SmartSpend</p>
              <p className="text-xs text-white/40">Financial Manager</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowed.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-0' : ''}`
              }
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-30" />}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-white/5">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {currentUser?.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
                <span className={`text-xs badge border ${roleColors[currentUser?.role]}`}>
                  {currentUser?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="text-white/40 hover:text-coral-400 transition-colors" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center py-2 text-white/40 hover:text-coral-400 transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-navy-800 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="text-white/50 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span className="text-white/30">|</span>
            <span>{new Date().toLocaleDateString('en-BH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
