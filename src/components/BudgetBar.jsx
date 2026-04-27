export default function BudgetBar({ category, spent, budget }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget;

  const barColor = over
    ? 'bg-coral-500'
    : pct >= 80
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const labelColor = over
    ? 'text-coral-400'
    : pct >= 80
    ? 'text-amber-400'
    : 'text-emerald-400';

  const status = over ? 'Over Budget' : pct >= 80 ? 'Near Limit' : 'On Track';

  return (
    <div className="glass-card p-4 hover:border-white/20 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <span className="font-semibold text-white text-sm">{category.name}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${labelColor} ${
          over ? 'bg-coral-500/10 border-coral-500/30'
               : pct >= 80 ? 'bg-amber-500/10 border-amber-500/30'
               : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          {status}
        </span>
      </div>
      <div className="w-full bg-navy-700 rounded-full h-2.5 mb-2 overflow-hidden">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-white/40">
        <span>
          Spent: <span className="text-white/70 font-medium">BHD {spent.toFixed(3)}</span>
        </span>
        <span>
          Budget: <span className="text-white/70 font-medium">BHD {budget.toFixed(3)}</span>
        </span>
        <span className={`font-semibold ${labelColor}`}>{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
