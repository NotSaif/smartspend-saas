import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Download } from 'lucide-react';
import { MONTH_NAMES } from '../data/mockData';

export default function Reports() {
  const { transactions, categories } = useApp();
  const { currentUser } = useAuth();
  const now = new Date();
  const [viewMode, setViewMode]     = useState('monthly');
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterCat, setFilterCat]   = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const companyId = currentUser?.companyId ?? null;

  const filtered = transactions.filter(t => {
    if (companyId !== null && t.companyId !== companyId) return false;
    if (new Date(t.date).getFullYear() !== filterYear) return false;
    if (filterCat !== 'all' && t.categoryId !== parseInt(filterCat)) return false;
    if (filterMethod !== 'all' && t.paymentMethod !== filterMethod) return false;
    return true;
  });

  const months = MONTH_NAMES.map((name, i) => {
    const m = i + 1;
    const mTx = filtered.filter(t => new Date(t.date).getMonth() + 1 === m);
    const income   = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { name, income, expenses, net: income - expenses, txCount: mTx.length };
  });

  const catBreakdown = categories
    .filter(c => companyId === null || c.companyId === companyId)
    .map(c => {
      const cTx = filtered.filter(t => t.categoryId === c.id);
      return { ...c, total: cTx.reduce((s, t) => s + t.amount, 0), count: cTx.length };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const yearIncome   = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const yearExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-white/40 text-sm mt-1">{filtered.length} transactions · {filterYear}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 p-1 bg-navy-800 rounded-xl border border-white/5">
            {[['monthly','Monthly'],['category','By Category']].map(([v, l]) => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode===v ? 'bg-brand-500 text-white' : 'text-white/40 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2 text-sm">
            <Download size={14}/> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <BarChart3 size={16} className="text-white/30"/>
        <select value={filterYear} onChange={e=>setFilterYear(parseInt(e.target.value))} className="input-field w-auto py-2 text-sm">
          {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="input-field w-auto py-2 text-sm">
          <option value="all">All Categories</option>
          {categories.filter(c => companyId === null || c.companyId === companyId).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={filterMethod} onChange={e=>setFilterMethod(e.target.value)} className="input-field w-auto py-2 text-sm">
          <option value="all">All Methods</option>
          {['cash','card','transfer'].map(m=><option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
        </select>
      </div>

      {/* Year totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {label:`${filterYear} Income`,  val:yearIncome,              c:'text-emerald-400',bg:'border-emerald-500/20'},
          {label:`${filterYear} Expenses`,val:yearExpenses,            c:'text-coral-400',  bg:'border-coral-500/20'},
          {label:`${filterYear} Net`,     val:yearIncome-yearExpenses, c:(yearIncome-yearExpenses)>=0?'text-emerald-400':'text-coral-400', bg:'border-brand-500/20'},
        ].map(({label,val,c,bg})=>(
          <div key={label} className={`glass-card p-5 border ${bg}`}>
            <p className="text-xs text-white/40 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${c}`}>BHD {val.toFixed(3)}</p>
          </div>
        ))}
      </div>

      {/* Monthly table */}
      {viewMode==='monthly' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">Monthly Summary — {filterYear}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-white/30 text-xs uppercase tracking-wide">
                  {['Month','Transactions','Income','Expenses','Net Balance','Status'].map(h=>(
                    <th key={h} className={`px-4 py-3 font-medium ${['Income','Expenses','Net Balance'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map(({name,income,expenses,net,txCount})=>(
                  <tr key={name} className="table-row">
                    <td className="px-4 py-3 font-medium text-white">{name}</td>
                    <td className="px-4 py-3 text-white/40">{txCount||'—'}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">{income>0?`BHD ${income.toFixed(3)}`:'—'}</td>
                    <td className="px-4 py-3 text-right text-coral-400 font-medium">{expenses>0?`BHD ${expenses.toFixed(3)}`:'—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${net>=0?'text-emerald-400':'text-coral-400'}`}>{txCount>0?`BHD ${net.toFixed(3)}`:'—'}</td>
                    <td className="px-4 py-3">
                      {txCount>0&&<span className={`badge border text-xs ${net>=0?'text-emerald-400 bg-emerald-500/10 border-emerald-500/30':'text-coral-400 bg-coral-500/10 border-coral-500/30'}`}>{net>=0?'Profit':'Loss'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10 bg-white/3">
                <tr className="font-bold">
                  <td className="px-4 py-3 text-white" colSpan={2}>Year Total</td>
                  <td className="px-4 py-3 text-right text-emerald-400">BHD {yearIncome.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-coral-400">BHD {yearExpenses.toFixed(3)}</td>
                  <td className={`px-4 py-3 text-right ${(yearIncome-yearExpenses)>=0?'text-emerald-400':'text-coral-400'}`}>BHD {(yearIncome-yearExpenses).toFixed(3)}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {viewMode==='category' && (
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">Breakdown by Category — {filterYear}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5">
                <tr className="text-white/30 text-xs uppercase tracking-wide">
                  {['Category','Type','Transactions','Total Amount','Share'].map(h=>(
                    <th key={h} className={`px-4 py-3 font-medium ${['Total Amount','Share'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catBreakdown.map(c=>{
                  const share=(yearIncome+yearExpenses)>0?((c.total/(yearIncome+yearExpenses))*100).toFixed(1):0;
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="px-4 py-3"><span className="flex items-center gap-2"><span className="text-lg">{c.icon}</span><span className="text-white/80">{c.name}</span></span></td>
                      <td className="px-4 py-3"><span className={`badge border text-xs ${c.type==='income'?'text-emerald-400 bg-emerald-500/10 border-emerald-500/30':'text-coral-400 bg-coral-500/10 border-coral-500/30'}`}>{c.type}</span></td>
                      <td className="px-4 py-3 text-white/40">{c.count}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${c.type==='income'?'text-emerald-400':'text-coral-400'}`}>BHD {c.total.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-navy-700 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full" style={{width:`${share}%`,background:c.color}}/>
                          </div>
                          <span className="text-white/40 text-xs w-10 text-right">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
