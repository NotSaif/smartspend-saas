import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import { DollarSign, TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle, Bell } from 'lucide-react';
import { MONTH_NAMES, BUDGET_ALERT_PCT, fmtBHD, monthOf, yearOf } from '../data/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'Inter', size: 12 } } },
    tooltip: {
      backgroundColor: '#0F1F3D', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
      titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.7)',
      callbacks: { label: (c) => ` ${c.dataset.label || c.label}: ${fmtBHD(c.raw)}` },
    },
  },
  scales: {
    x: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.03)' } },
    y: { ticks: { color: 'rgba(255,255,255,0.4)', callback: v => 'BD ' + v }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

export default function Dashboard() {
  const { transactions, budgets, categories, anomalies, loading, getCategorySpending, getMonthlySummary } = useApp();
  const { currentUser, canEdit } = useAuth();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const { income, expenses, net } = getMonthlySummary(month, year);
  const prev = getMonthlySummary(prevMonth, prevYear);
  const pctChange = (cur, old) => (old > 0 ? Math.round(((cur - old) / old) * 100) : undefined);

  // Budgets of the current month with their spending
  const monthBudgets = budgets
    .filter(b => b.month === month && b.year === year)
    .map(b => {
      const spent = getCategorySpending(b.categoryId, month, year);
      return { ...b, spent, pct: b.amount > 0 ? (spent / b.amount) * 100 : 0, category: categories.find(c => c.id === b.categoryId) };
    })
    .filter(b => b.category);
  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + b.spent, 0);
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const budgetAlerts = monthBudgets.filter(b => b.pct >= BUDGET_ALERT_PCT).sort((a, b) => b.pct - a.pct);

  // Doughnut — this month's spending by category
  const totals = {};
    transactions
      .filter(t => t.type === 'expense' && monthOf(t.date) === month && yearOf(t.date) === year)
      .forEach(t => { totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount; });
  const spendCats = categories.filter(c => totals[c.id]).sort((a, b) => totals[b.id] - totals[a.id]);
  const doughnutData = {
    labels: spendCats.map(c => c.name),
    datasets: [{
      data: spendCats.map(c => totals[c.id]),
      backgroundColor: spendCats.map(c => c.color + 'CC'),
      borderColor: spendCats.map(c => c.color),
      borderWidth: 1,
    }],
  };

  // Bar — income vs expenses for the last 4 months
  const last4 = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(year, month - 4 + i, 1);
    return { label: MONTH_NAMES[d.getMonth()].slice(0, 3), ...getMonthlySummary(d.getMonth() + 1, d.getFullYear()) };
  });
  const barData = {
    labels: last4.map(m => m.label),
    datasets: [
      { label: 'Income',   data: last4.map(m => m.income),   backgroundColor: '#10B98180', borderColor: '#10B981', borderWidth: 1, borderRadius: 6 },
      { label: 'Expenses', data: last4.map(m => m.expenses), backgroundColor: '#EF444480', borderColor: '#EF4444', borderWidth: 1, borderRadius: 6 },
    ],
  };

  const recent = transactions.slice(0, 6); // already sorted newest first by the API

  if (loading && !transactions.length) {
    return <div className="flex items-center justify-center h-64 text-white/40">Loading your financial data…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">{MONTH_NAMES[month - 1]} {year} · {currentUser?.companyName}</p>
      </div>

      {transactions.length === 0 && (
        <div className="glass-card p-6 border border-brand-500/30 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-semibold text-white">Welcome to SmartSpend!</h2>
            <p className="text-sm text-white/50 mt-1">
              Your company has no transactions yet. {canEdit ? 'Add your first income or expense to see your dashboard come to life.' : 'Your Business Owner or Administrator can add transactions.'}
            </p>
          </div>
          {canEdit && <Link to="/transactions" className="btn-primary text-center">Add a transaction</Link>}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={fmtBHD(income)} icon={TrendingUp} color="green"
          trend={pctChange(income, prev.income)} subtitle={`vs ${MONTH_NAMES[prevMonth - 1]}`} />
        <StatCard title="Total Expenses" value={fmtBHD(expenses)} icon={TrendingDown} color="red"
          trend={pctChange(expenses, prev.expenses)} trendGoodWhenDown subtitle={`vs ${MONTH_NAMES[prevMonth - 1]}`} />
        <StatCard title="Net Balance" value={fmtBHD(net)} icon={DollarSign} color={net >= 0 ? 'green' : 'red'}
          subtitle={net >= 0 ? 'Profitable month' : 'Loss this month'} />
        <StatCard title="Budget Utilised" value={`${budgetPct}%`} icon={Wallet}
          color={budgetPct >= 100 ? 'red' : budgetPct >= BUDGET_ALERT_PCT ? 'amber' : 'blue'}
          subtitle={totalBudget > 0 ? `${fmtBHD(totalSpent)} of ${fmtBHD(totalBudget)}` : 'No budgets set this month'} />
      </div>

      {/* Alerts */}
      {(anomalies.length > 0 || budgetAlerts.length > 0) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {anomalies.length > 0 && (
            <div className="glass-card p-5 border border-amber-500/25">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-400" />
                <h2 className="text-base font-semibold text-white">Anomaly Alerts</h2>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {anomalies.length} flagged
                </span>
              </div>
              <p className="text-xs text-white/40 mb-3">Expenses far above their category's usual amount (z-score above 2)</p>
              <div className="space-y-2">
                {anomalies.slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <span className="text-xl flex-shrink-0">{a.category_icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.description}</p>
                      <p className="text-xs text-white/40">{a.category_name} · {a.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-amber-400">{fmtBHD(a.amount)}</p>
                      <p className="text-xs text-white/40">
                        {a.z_score ? `z = ${a.z_score}` : `${a.ratio}× avg`} · avg {fmtBHD(a.avg_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {budgetAlerts.length > 0 && (
            <div className="glass-card p-5 border border-coral-500/25">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={16} className="text-coral-400" />
                <h2 className="text-base font-semibold text-white">Budget Alerts</h2>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-coral-500/20 text-coral-400 border border-coral-500/30">
                  {budgetAlerts.length} at {BUDGET_ALERT_PCT}%+
                </span>
              </div>
              <p className="text-xs text-white/40 mb-3">Categories that have used at least {BUDGET_ALERT_PCT}% of this month's budget</p>
              <div className="space-y-2">
                {budgetAlerts.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-coral-500/5 border border-coral-500/10">
                    <span className="text-xl flex-shrink-0">{b.category.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{b.category.name}</p>
                      <p className="text-xs text-white/40">{fmtBHD(b.spent)} of {fmtBHD(b.amount)}</p>
                    </div>
                    <span className={`text-sm font-bold ${b.pct > 100 ? 'text-coral-400' : 'text-amber-400'}`}>
                      {Math.round(b.pct)}%{b.pct > 100 ? ' · Over' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Income vs Expenses — Last 4 Months</h2>
          <div className="h-56"><Bar data={barData} options={chartOptions} /></div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Spending by Category</h2>
          <div className="h-56 flex items-center justify-center">
            {doughnutData.labels.length ? (
              <Doughnut data={doughnutData} options={{
                ...chartOptions, scales: undefined, cutout: '65%',
                plugins: { ...chartOptions.plugins, legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, padding: 10, boxWidth: 10 } } },
              }} />
            ) : <p className="text-sm text-white/30">No expenses this month</p>}
          </div>
        </div>
      </div>

      {/* Budget status */}
      {monthBudgets.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Budget Status — {MONTH_NAMES[month - 1]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {monthBudgets.map(b => <BudgetBar key={b.id} category={b.category} spent={b.spent} budget={b.amount} />)}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
            <Link to="/transactions" className="text-xs text-brand-300 hover:text-brand-400">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wide border-b border-white/5">
                  <th className="text-left pb-3 font-medium">Date</th>
                  <th className="text-left pb-3 font-medium">Description</th>
                  <th className="text-left pb-3 font-medium">Category</th>
                  <th className="text-left pb-3 font-medium hidden sm:table-cell">Method</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t.id} className="table-row">
                    <td className="py-3 text-white/40 whitespace-nowrap">{t.date}</td>
                    <td className="py-3 text-white/80 max-w-[200px] truncate">{t.description}</td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: (t.categoryColor || '#888') + '20', color: t.categoryColor || '#888' }}>
                        {t.categoryIcon} {t.categoryName || 'Uncategorised'}
                      </span>
                    </td>
                    <td className="py-3 text-white/40 capitalize hidden sm:table-cell">{t.paymentMethod}</td>
                    <td className="py-3 text-right font-semibold whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 ${t.type === 'income' ? 'text-emerald-400' : 'text-coral-400'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {fmtBHD(t.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
