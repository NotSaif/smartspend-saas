import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Download, Printer } from 'lucide-react';
import { MONTH_NAMES, fmtBHD, monthOf, yearOf } from '../data/constants';

// Build a CSV file in the browser and download it (FR-13)
function downloadCSV(filename, header, rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { transactions, categories } = useApp();
  const { currentUser } = useAuth();
  const now = new Date();
  const [view, setView] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');

  const years = [...new Set([now.getFullYear(), ...transactions.map(t => yearOf(t.date))])].sort((a, b) => b - a);
  const periodLabel = month === 'all' ? String(year) : `${MONTH_NAMES[month - 1]} ${year}`;

  const filtered = transactions.filter(t => {
    if (yearOf(t.date) !== year) return false;
    if (month !== 'all' && monthOf(t.date) !== Number(month)) return false;
    if (filterCat !== 'all' && t.categoryId !== parseInt(filterCat)) return false;
    if (filterMethod !== 'all' && t.paymentMethod !== filterMethod) return false;
    return true;
  });

  const months = MONTH_NAMES.map((name, i) => {
    const mTx = filtered.filter(t => monthOf(t.date) === i + 1);
    const income = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { name, income, expenses, net: income - expenses, count: mTx.length };
  }).filter((_, i) => month === 'all' || i + 1 === Number(month));

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const catBreakdown = categories.map(c => {
    const cTx = filtered.filter(t => t.categoryId === c.id);
    const total = cTx.reduce((s, t) => s + t.amount, 0);
    const base = c.type === 'income' ? totalIncome : totalExpenses;
    return { ...c, total, count: cTx.length, share: base > 0 ? (total / base) * 100 : 0 };
  }).filter(c => c.total > 0).sort((a, b) => (a.type === b.type ? b.total - a.total : a.type === 'income' ? -1 : 1));

  const exportCSV = () => {
    const company = (currentUser?.companyName || 'company').replace(/[^\w]+/g, '_');
    if (view === 'monthly') {
      downloadCSV(`SmartSpend_${company}_monthly_${periodLabel.replace(' ', '_')}.csv`,
        ['Month', 'Transactions', 'Income (BHD)', 'Expenses (BHD)', 'Net (BHD)', 'Status'],
        [...months.map(m => [m.name, m.count, m.income.toFixed(3), m.expenses.toFixed(3), m.net.toFixed(3), m.count ? (m.net >= 0 ? 'Profit' : 'Loss') : '']),
          ['Total', filtered.length, totalIncome.toFixed(3), totalExpenses.toFixed(3), (totalIncome - totalExpenses).toFixed(3), '']]);
    } else {
      downloadCSV(`SmartSpend_${company}_categories_${periodLabel.replace(' ', '_')}.csv`,
        ['Category', 'Type', 'Transactions', 'Total (BHD)', 'Share of type (%)'],
        catBreakdown.map(c => [c.name, c.type, c.count, c.total.toFixed(3), c.share.toFixed(1)]));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-white/40 text-sm mt-1">{filtered.length} transactions · {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-navy-800 rounded-xl border border-white/5">
            {[['monthly', 'Monthly'], ['category', 'By Category']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === v ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-primary flex items-center gap-2 text-sm"><Download size={14} /> Export CSV</button>
          <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2 text-sm"><Printer size={14} /> Print / PDF</button>
        </div>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-center print:hidden">
        <BarChart3 size={16} className="text-white/30" />
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field w-auto py-2 text-sm" aria-label="Year">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Month">
          <option value="all">Whole year</option>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Category">
          <option value="all">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="input-field w-auto py-2 text-sm" aria-label="Payment method">
          <option value="all">All methods</option>
          {['cash', 'card', 'transfer'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Income', val: totalIncome, c: 'text-emerald-400', b: 'border-emerald-500/20' },
          { label: 'Expenses', val: totalExpenses, c: 'text-coral-400', b: 'border-coral-500/20' },
          { label: 'Net', val: totalIncome - totalExpenses, c: totalIncome - totalExpenses >= 0 ? 'text-emerald-400' : 'text-coral-400', b: 'border-brand-500/20' },
        ].map(({ label, val, c, b }) => (
          <div key={label} className={`glass-card p-5 border ${b}`}>
            <p className="text-xs text-white/40 mb-1">{periodLabel} {label}</p>
            <p className={`text-2xl font-bold ${c}`}>{fmtBHD(val)}</p>
          </div>
        ))}
      </div>

      {view === 'monthly' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">Monthly Summary — {periodLabel}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-white/30 text-xs uppercase tracking-wide">
                  {['Month', 'Transactions', 'Income', 'Expenses', 'Net Balance', 'Status'].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium ${['Income', 'Expenses', 'Net Balance'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map(({ name, income, expenses, net, count }) => (
                  <tr key={name} className="table-row">
                    <td className="px-4 py-3 font-medium text-white">{name}</td>
                    <td className="px-4 py-3 text-white/40">{count || '—'}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium whitespace-nowrap">{income > 0 ? fmtBHD(income) : '—'}</td>
                    <td className="px-4 py-3 text-right text-coral-400 font-medium whitespace-nowrap">{expenses > 0 ? fmtBHD(expenses) : '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${net >= 0 ? 'text-emerald-400' : 'text-coral-400'}`}>{count > 0 ? fmtBHD(net) : '—'}</td>
                    <td className="px-4 py-3">
                      {count > 0 && <span className={`badge border text-xs ${net >= 0 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-coral-400 bg-coral-500/10 border-coral-500/30'}`}>{net >= 0 ? 'Profit' : 'Loss'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10 bg-white/3">
                <tr className="font-bold">
                  <td className="px-4 py-3 text-white" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right text-emerald-400 whitespace-nowrap">{fmtBHD(totalIncome)}</td>
                  <td className="px-4 py-3 text-right text-coral-400 whitespace-nowrap">{fmtBHD(totalExpenses)}</td>
                  <td className={`px-4 py-3 text-right whitespace-nowrap ${totalIncome - totalExpenses >= 0 ? 'text-emerald-400' : 'text-coral-400'}`}>{fmtBHD(totalIncome - totalExpenses)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {view === 'category' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">Breakdown by Category — {periodLabel}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-white/30 text-xs uppercase tracking-wide">
                  {['Category', 'Type', 'Transactions', 'Total Amount', 'Share of Type'].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium ${['Total Amount', 'Share of Type'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catBreakdown.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-white/30">No transactions in this period</td></tr>}
                {catBreakdown.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="px-4 py-3"><span className="flex items-center gap-2"><span className="text-lg">{c.icon}</span><span className="text-white/80">{c.name}</span></span></td>
                    <td className="px-4 py-3"><span className={`badge border text-xs ${c.type === 'income' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-coral-400 bg-coral-500/10 border-coral-500/30'}`}>{c.type}</span></td>
                    <td className="px-4 py-3 text-white/40">{c.count}</td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${c.type === 'income' ? 'text-emerald-400' : 'text-coral-400'}`}>{fmtBHD(c.total)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-navy-700 rounded-full h-1.5 overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${c.share}%`, background: c.color }} />
                        </div>
                        <span className="text-white/40 text-xs w-12 text-right">{c.share.toFixed(1)}%</span>
                      </div>
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
