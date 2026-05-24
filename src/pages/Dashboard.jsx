import { useMemo } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import {
  DollarSign, TrendingDown, TrendingUp, Wallet,
  ArrowUpRight, ArrowDownRight, AlertTriangle,
} from 'lucide-react';
import { MONTH_NAMES } from '../data/mockData';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const fmtBHD = (n) => `BHD ${n.toFixed(3)}`;

export default function Dashboard() {
  const {
    transactions, budgets, categories, companies,
    getCategorySpending, getMonthlySummary, anomalies,
  } = useApp();
  const { currentUser } = useAuth();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();
  const companyId = currentUser?.companyId ?? null;

  // Resolve company name
  const company = companies.find(c => c.id === companyId);
  const companyName = company?.name || (currentUser?.role === 'admin' ? 'All Companies' : 'My Company');

  // Monthly summary
  const { income, expenses, net } = getMonthlySummary(month, year, companyId);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const prev      = getMonthlySummary(prevMonth, prevYear, companyId);
  const incTrend  = prev.income   > 0 ? Math.round(((income   - prev.income)   / prev.income)   * 100) : 0;
  const expTrend  = prev.expenses > 0 ? Math.round(((expenses - prev.expenses) / prev.expenses) * 100) : 0;

  // Budget usage
  const myBudgets  = budgets.filter(b =>
    (companyId === null || b.companyId === companyId) && b.month === month && b.year === year
  );
  const totalBudget = myBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = myBudgets.reduce((s, b) => s + getCategorySpending(b.categoryId, month, year, companyId), 0);
  const budgetPct   = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Expense categories (memoised to keep doughnut stable)
  const expCats = useMemo(
    () => categories.filter(c => c.type === 'expense' && (companyId === null || c.companyId === companyId || !c.companyId)),
    [categories, companyId]
  );

  // Doughnut — spending by category this month
  const doughnutData = useMemo(() => {
    const withData = expCats.filter(c =>
      transactions.some(t =>
        t.categoryId === c.id && t.type === 'expense' &&
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year
      )
    );
    return {
      labels: withData.map(c => c.name),
      datasets: [{
        data: withData.map(c =>
          transactions
            .filter(t => t.categoryId === c.id && t.type === 'expense' &&
              new Date(t.date).getMonth() + 1 === month &&
              new Date(t.date).getFullYear() === year)
            .reduce((s, t) => s + t.amount, 0)
        ),
        backgroundColor: withData.map(c => c.color + 'CC'),
        borderColor:     withData.map(c => c.color),
        borderWidth: 1,
      }],
    };
  }, [transactions, expCats, month, year]);

  // Bar — income vs expenses last 4 months
  const last4 = Array.from({ length: 4 }, (_, i) => {
    const m    = month - 3 + i;
    const y    = m <= 0 ? year - 1 : year;
    const adjM = m <= 0 ? m + 12 : m;
    return { label: MONTH_NAMES[adjM - 1].slice(0, 3), ...getMonthlySummary(adjM, y, companyId) };
  });

  const barData = {
    labels: last4.map(m => m.label),
    datasets: [
      { label: 'Income',   data: last4.map(m => m.income),   backgroundColor: '#10B98180', borderColor: '#10B981', borderWidth: 1, borderRadius: 6 },
      { label: 'Expenses', data: last4.map(m => m.expenses), backgroundColor: '#EF444480', borderColor: '#EF4444', borderWidth: 1, borderRadius: 6 },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.6)', font: { family: 'Inter', size: 12 } } },
      tooltip: {
        backgroundColor: '#0F1F3D', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.6)',
      },
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.4)' }, grid: { color: 'rgba(255,255,255,0.03)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.4)', callback: v => 'BD ' + v }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  // Recent transactions
  const recent = [...transactions]
    .filter(t => companyId === null || t.companyId === companyId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Financial Dashboard
          {company?.is_demo && (
            <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold rounded">
              DEMO ACCOUNT
            </span>
          )}
        </h1>
        <p className="text-white/40 text-sm mt-1">{MONTH_NAMES[month - 1]} {year} · {companyName}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Income"    value={fmtBHD(income)}   icon={TrendingUp}   color="green" trend={incTrend}  subtitle={`vs ${MONTH_NAMES[prevMonth-1]}`} />
        <StatCard title="Total Expenses"  value={fmtBHD(expenses)} icon={TrendingDown} color="red"   trend={-expTrend} subtitle={`vs ${MONTH_NAMES[prevMonth-1]}`} />
        <StatCard title="Net Balance"     value={fmtBHD(net)}      icon={DollarSign}   color={net >= 0 ? 'green' : 'red'} subtitle={net >= 0 ? 'Profitable month' : 'Loss this month'} />
        <StatCard title="Budget Utilized" value={`${budgetPct}%`}  icon={Wallet}       color={budgetPct >= 80 ? 'red' : budgetPct >= 60 ? 'amber' : 'blue'} subtitle={`${fmtBHD(totalSpent)} of ${fmtBHD(totalBudget)}`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Income vs Expenses — Last 4 Months</h2>
          <div className="h-56">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
        <div className="glass-card p-6">
          <h2 className="text-base font-semibold text-white mb-4">Spending by Category</h2>
          <div className="h-56 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                ...chartOptions,
                scales: undefined,
                cutout: '65%',
                plugins: {
                  ...chartOptions.plugins,
                  legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.5)', font: { size: 10 }, padding: 10 } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Anomaly Alerts ──────────────────────────────────────── */}
      {anomalies.length > 0 && (
        <div className="glass-card p-6 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Anomaly Alerts</h2>
              <p className="text-xs text-white/40">Expenses that significantly exceed your historical category average</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {anomalies.length} flagged
            </span>
          </div>

          <div className="space-y-2">
            {anomalies.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/25 transition-colors">
                <span className="text-xl flex-shrink-0">{a.category_icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{a.description}</p>
                  <p className="text-xs text-white/40">
                    {a.category_name} · {a.date}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-amber-400">BHD {parseFloat(a.amount).toFixed(3)}</p>
                  <p className="text-xs text-white/40">
                    {parseFloat(a.ratio).toFixed(1)}× avg (BHD {parseFloat(a.avg_amount).toFixed(3)})
                  </p>
                </div>
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={11} className="text-amber-400" />
                </div>
              </div>
            ))}
            {anomalies.length > 5 && (
              <p className="text-xs text-white/30 text-center pt-1">
                +{anomalies.length - 5} more flagged transactions — check the Transactions page
              </p>
            )}
          </div>
        </div>
      )}

      {/* Budget bars */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Budget Status — {MONTH_NAMES[month - 1]}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {budgets
            .filter(b => (companyId === null || b.companyId === companyId) && b.month === month && b.year === year)
            .map(b => {
              const cat   = categories.find(c => c.id === b.categoryId);
              if (!cat) return null;
              const spent = getCategorySpending(b.categoryId, month, year, companyId);
              return <BudgetBar key={b.id} category={cat} spent={spent} budget={b.amount} />;
            })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/30 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left pb-3 font-medium">Date</th>
                <th className="text-left pb-3 font-medium">Description</th>
                <th className="text-left pb-3 font-medium">Category</th>
                <th className="text-left pb-3 font-medium">Method</th>
                <th className="text-right pb-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(t => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <tr key={t.id} className="table-row">
                    <td className="py-3 text-white/40">{t.date}</td>
                    <td className="py-3 text-white/80 max-w-[180px] truncate">{t.description}</td>
                    <td className="py-3">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: (cat?.color || '#888') + '20', color: cat?.color || '#888' }}>
                        {cat?.icon} {cat?.name}
                      </span>
                    </td>
                    <td className="py-3 text-white/40 capitalize">{t.paymentMethod}</td>
                    <td className="py-3 text-right font-semibold">
                      <span className={`flex items-center justify-end gap-1 ${t.type === 'income' ? 'text-emerald-400' : 'text-coral-400'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        BHD {t.amount.toFixed(3)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
