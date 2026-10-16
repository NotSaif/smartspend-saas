import { BUDGET_ALERT_PCT, fmtBHD } from '../data/constants';

// Status: On Track below 90%, Near Limit from 90% to 100%, Over Budget above the limit
export default function BudgetBar({ category, spent, budget }) {
  const rawPct = budget > 0 ? (spent / budget) * 100 : 0;
  const pct = Math.min(rawPct, 100);
  const over = spent > budget;
  const near = !over && rawPct >= BUDGET_ALERT_PCT;

  const tone = over ? 'coral' : near ? 'amber' : 'emerald';
  const styles = {
    coral:   { bar: 'bg-coral-500',   text: 'text-coral-400',   badge: 'bg-coral-500/10 border-coral-500/30' },
    amber:   { bar: 'bg-amber-500',   text: 'text-amber-400',   badge: 'bg-amber-500/10 border-amber-500/30' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30' },
  }[tone];
  const status = over ? 'Over Budget' : near ? 'Near Limit' : 'On Track';

  return (
    <div className="glass-card p-4 hover:border-white/20 transition-all duration-200">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{category.icon}</span>
          <span className="font-semibold text-white text-sm truncate">{category.name}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${styles.text} ${styles.badge}`}>{status}</span>
      </div>
      <div className="w-full bg-navy-700 rounded-full h-2.5 mb-2 overflow-hidden">
        <div className={`${styles.bar} h-2.5 rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-white/40 gap-2">
        <span>Spent: <span className="text-white/70 font-medium">{fmtBHD(spent)}</span></span>
        <span>Budget: <span className="text-white/70 font-medium">{fmtBHD(budget)}</span></span>
        <span className={`font-semibold ${styles.text}`}>{Math.round(rawPct)}%</span>
      </div>
    </div>
  );
}
