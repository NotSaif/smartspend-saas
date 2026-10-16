import { BUDGET_ALERT_PCT, fmtBHD } from '../data/constants';

// Status: On Track below 90%, Near Limit from 90% to 100%, Over Budget above the limit
export default function BudgetBar({ category, spent, budget }) {
  const rawPct = budget > 0 ? (spent / budget) * 100 : 0;
  const pct = Math.min(rawPct, 100);
  const over = spent > budget;
  const near = !over && rawPct >= BUDGET_ALERT_PCT;

  const s = over
    ? { bar: 'from-coral-500 to-coral-400', glow: 'shadow-[0_0_14px_rgba(251,113,133,0.7)]', text: 'text-coral-300', badge: 'bg-coral-500/[0.12] ring-coral-400/25', label: 'Over Budget' }
    : near
      ? { bar: 'from-amber-500 to-amber-300', glow: 'shadow-[0_0_14px_rgba(251,191,36,0.6)]', text: 'text-amber-300', badge: 'bg-amber-500/[0.12] ring-amber-400/25', label: 'Near Limit' }
      : { bar: 'from-emerald-500 to-cyan-400', glow: 'shadow-[0_0_14px_rgba(52,211,153,0.55)]', text: 'text-emerald-300', badge: 'bg-emerald-500/[0.12] ring-emerald-400/25', label: 'On Track' };

  return (
    <div className="glass-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: (category.color || '#9B83FF') + '22' }}>{category.icon}</span>
          <span className="truncate text-sm font-semibold text-white">{category.name}</span>
        </div>
        <span className={`badge whitespace-nowrap ring-1 ring-inset ${s.text} ${s.badge}`}>{s.label}</span>
      </div>
      <div className="mb-2.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-2 rounded-full bg-gradient-to-r ${s.bar} ${s.glow} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between gap-2 text-xs text-white/40">
        <span>Spent: <span className="num font-semibold text-white/75">{fmtBHD(spent)}</span></span>
        <span>Budget: <span className="num font-semibold text-white/75">{fmtBHD(budget)}</span></span>
        <span className={`num font-bold ${s.text}`}>{Math.round(rawPct)}%</span>
      </div>
    </div>
  );
}
