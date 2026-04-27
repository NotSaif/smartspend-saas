import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'blue' }) {
  const colorMap = {
    blue:   { icon: 'text-brand-400 bg-brand-500/15', border: 'hover:border-brand-500/40', glow: '' },
    green:  { icon: 'text-emerald-400 bg-emerald-500/15', border: 'hover:border-emerald-500/40', glow: '' },
    red:    { icon: 'text-coral-400 bg-coral-500/15', border: 'hover:border-coral-500/40', glow: '' },
    amber:  { icon: 'text-amber-400 bg-amber-500/15', border: 'hover:border-amber-500/40', glow: '' },
  };
  const c = colorMap[color];

  return (
    <div className={`stat-card ${c.border} cursor-default`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.icon}`}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-coral-400 bg-coral-500/10'
          }`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-white/50 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {(subtitle || trendLabel) && (
        <p className="text-xs text-white/30 mt-1">{subtitle || trendLabel}</p>
      )}
    </div>
  );
}
