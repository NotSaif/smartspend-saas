import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import { PageHeader, Skeleton } from '../components/ui';
import {
  DollarSign, TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, AlertTriangle, Bell, ArrowRight, Sparkles,
} from 'lucide-react';
import { MONTH_NAMES, BUDGET_ALERT_PCT, fmtBHD, monthOf, yearOf } from '../data/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
ChartJS.defaults.font.family = '"Plus Jakarta Sans", Inter, sans-serif';

const tooltip = {
  backgroundColor: 'rgba(12,14,26,0.95)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
  titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.75)', padding: 12, cornerRadius: 12, boxPadding: 6,
  callbacks: { label: (c) => ` ${c.dataset.label || c.label}: ${fmtBHD(c.raw)}` },
};

// Vertical gradient fill for a bar dataset
const gradient = (top, bottom) => (ctx) => {
  const { chart } = ctx;
  if (!chart.chartArea) return top;
  const g = chart.ctx.createLinearGradient(0, chart.chartArea.bottom, 0, chart.chartArea.top);
  g.addColorStop(0, bottom);
  g.addColorStop(1, top);
  return g;
};

// Writes the month's total spending in the middle of the doughnut
const centerText = {
  id: 'centerText',
  afterDraw(chart, _args, opts) {
    const { ctx, chartArea } = chart;
    if (!chartArea || !opts?.value) return;
    const x = (chartArea.left + chartArea.right) / 2, y = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('SPENT', x, y - 10);
    ctx.fillStyle = '#fff';
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(opts.value, x, y + 10);
    ctx.restore();
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

  // Last 6 months, oldest first (sparklines) — the last 4 feed the bar chart
  const history = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 6 + i, 1);
    return { label: MONTH_NAMES[d.getMonth()].slice(0, 3), ...getMonthlySummary(d.getMonth() + 1, d.getFullYear()) };
  });

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
      backgroundColor: spendCats.map(c => c.color),
      borderColor: '#0C0E1A', borderWidth: 3, hoverOffset: 8, borderRadius: 6, spacing: 2,
    }],
  };

  const last4 = history.slice(2);
  const barData = {
    labels: last4.map(m => m.label),
    datasets: [
      { label: 'Income', data: last4.map(m => m.income), backgroundColor: gradient('#34D399', 'rgba(16,185,129,0.15)'), borderRadius: 10, borderSkipped: false, maxBarThickness: 34 },
      { label: 'Expenses', data: last4.map(m => m.expenses), backgroundColor: gradient('#FB7185', 'rgba(244,63,94,0.15)'), borderRadius: 10, borderSkipped: false, maxBarThickness: 34 },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', align: 'end', labels: { color: 'rgba(255,255,255,0.6)', usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16 } },
      tooltip,
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.45)' }, grid: { display: false }, border: { display: false } },
      y: { ticks: { color: 'rgba(255,255,255,0.35)', callback: v => 'BD ' + v.toLocaleString() }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
    },
  };

  const recent = transactions.slice(0, 6); // newest first from the API

  if (loading && !transactions.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-36" />)}</div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker={`${MONTH_NAMES[month - 1]} ${year} · ${currentUser?.companyName ?? ''}`} title="Financial Dashboard"
        subtitle="Your company's money at a glance — updated with every transaction.">
        {canEdit && <Link to="/transactions" className="btn-primary text-sm">Add transaction <ArrowRight size={15} /></Link>}
      </PageHeader>

      {transactions.length === 0 && (
        <div className="glass-card glow-border flex flex-col gap-4 p-6 sm:flex-row sm:items-center animate-rise">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-glow"><Sparkles size={22} /></div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-white">Welcome to SmartSpend!</h2>
            <p className="mt-1 text-sm text-white/50">
              Your company has no transactions yet. {canEdit ? 'Add your first income or expense to see your dashboard come to life.' : 'Your Business Owner or Administrator can add transactions.'}
            </p>
          </div>
          {canEdit && <Link to="/transactions" className="btn-primary">Add a transaction</Link>}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Income" value={income} format={fmtBHD} icon={TrendingUp} color="green" delay={0}
          trend={pctChange(income, prev.income)} subtitle={`vs ${MONTH_NAMES[prevMonth - 1]}`} spark={history.map(m => m.income)} />
        <StatCard title="Total Expenses" value={expenses} format={fmtBHD} icon={TrendingDown} color="red" delay={60}
          trend={pctChange(expenses, prev.expenses)} trendGoodWhenDown subtitle={`vs ${MONTH_NAMES[prevMonth - 1]}`} spark={history.map(m => m.expenses)} />
        <StatCard title="Net Balance" value={net} format={fmtBHD} icon={DollarSign} color={net >= 0 ? 'green' : 'red'} delay={120}
          subtitle={net >= 0 ? 'Profitable month' : 'Loss this month'} spark={history.map(m => m.net)} />
        <StatCard title="Budget Utilised" value={budgetPct} format={v => `${Math.round(v)}%`} icon={Wallet} delay={180}
          color={budgetPct > 100 ? 'red' : budgetPct >= BUDGET_ALERT_PCT ? 'amber' : 'blue'}
          subtitle={totalBudget > 0 ? `${fmtBHD(totalSpent)} of ${fmtBHD(totalBudget)}` : 'No budgets set this month'} />
      </div>

      {/* Alerts */}
      {(anomalies.length > 0 || budgetAlerts.length > 0) && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {anomalies.length > 0 && (
            <div className="glass-card overflow-hidden p-5 animate-rise">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-500/[0.12] to-transparent" />
              <div className="relative mb-1 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 animate-pulse-ring"><AlertTriangle size={17} /></span>
                <h2 className="section-title">Anomaly Alerts</h2>
                <span className="badge ml-auto bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30">{anomalies.length} flagged</span>
              </div>
              <p className="relative mb-4 ml-12 text-xs text-white/40">Expenses far above their category's usual amount (z-score above 2)</p>
              <div className="relative space-y-2">
                {anomalies.slice(0, 4).map(a => (
                  <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-3 transition-colors hover:border-amber-400/30">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xl">{a.category_icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{a.description}</p>
                      <p className="text-xs text-white/40">{a.category_name} · {a.date}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="num text-sm font-bold text-amber-300">{fmtBHD(a.amount)}</p>
                      <p className="text-xs text-white/40">{a.z_score ? `z = ${a.z_score}` : `${a.ratio}× avg`} · avg {fmtBHD(a.avg_amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {budgetAlerts.length > 0 && (
            <div className="glass-card overflow-hidden p-5 animate-rise [animation-delay:60ms]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-coral-500/[0.12] to-transparent" />
              <div className="relative mb-1 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-500/20 text-coral-300"><Bell size={17} /></span>
                <h2 className="section-title">Budget Alerts</h2>
                <span className="badge ml-auto bg-coral-500/15 text-coral-300 ring-1 ring-inset ring-coral-400/30">{budgetAlerts.length} at {BUDGET_ALERT_PCT}%+</span>
              </div>
              <p className="relative mb-4 ml-12 text-xs text-white/40">Categories that have used at least {BUDGET_ALERT_PCT}% of this month's budget</p>
              <div className="relative space-y-2">
                {budgetAlerts.map(b => (
                  <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xl">{b.category.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{b.category.name}</p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className={`h-1.5 rounded-full bg-gradient-to-r ${b.pct > 100 ? 'from-coral-500 to-coral-400' : 'from-amber-500 to-amber-300'}`} style={{ width: `${Math.min(b.pct, 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-white/40">{fmtBHD(b.spent)} of {fmtBHD(b.amount)}</p>
                    </div>
                    <span className={`num text-sm font-bold ${b.pct > 100 ? 'text-coral-300' : 'text-amber-300'}`}>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-6 lg:col-span-2 animate-rise">
          <p className="kicker">Cash flow</p>
          <h2 className="section-title mt-1">Income vs Expenses — Last 4 Months</h2>
          <div className="mt-4 h-64"><Bar data={barData} options={barOptions} /></div>
        </div>
        <div className="glass-card p-6 animate-rise [animation-delay:60ms]">
          <p className="kicker">This month</p>
          <h2 className="section-title mt-1">Spending by Category</h2>
          <div className="mt-4 flex h-64 items-center justify-center">
            {doughnutData.labels.length ? (
              <Doughnut data={doughnutData} plugins={[centerText]} options={{
                responsive: true, maintainAspectRatio: false, cutout: '72%',
                plugins: {
                  centerText: { value: fmtBHD(expenses) },
                  tooltip,
                  legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.55)', font: { size: 10 }, padding: 10, boxWidth: 8, usePointStyle: true, pointStyle: 'circle' } },
                },
              }} />
            ) : <p className="text-sm text-white/35">No expenses this month</p>}
          </div>
        </div>
      </div>

      {/* Budget status */}
      {monthBudgets.length > 0 && (
        <div className="animate-rise">
          <div className="mb-3 flex items-end justify-between">
            <div><p className="kicker">Spending limits</p><h2 className="section-title mt-1">Budget Status — {MONTH_NAMES[month - 1]}</h2></div>
            {canEdit && <Link to="/budgets" className="text-xs font-semibold text-brand-300 hover:text-brand-200">Manage budgets →</Link>}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {monthBudgets.map(b => <BudgetBar key={b.id} category={b.category} spent={b.spent} budget={b.amount} />)}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div className="glass-card p-6 animate-rise">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="kicker">Activity</p><h2 className="section-title mt-1">Recent Transactions</h2></div>
            <Link to="/transactions" className="text-xs font-semibold text-brand-300 hover:text-brand-200">View all →</Link>
          </div>
          <div className="space-y-1">
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: (t.categoryColor || '#888') + '22' }}>{t.categoryIcon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{t.description}</p>
                  <p className="text-xs text-white/40">{t.categoryName || 'Uncategorised'} · <span className="capitalize">{t.paymentMethod}</span> · {t.date}</p>
                </div>
                <span className={`num inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold ${t.type === 'income' ? 'text-emerald-300' : 'text-coral-300'}`}>
                  {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {fmtBHD(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
