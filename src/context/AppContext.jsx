import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from '../components/Toast';
import { useAuth } from './AuthContext';
import { transactionsAPI, budgetsAPI, categoriesAPI, anomaliesAPI } from '../services/api';
import { monthOf, yearOf } from '../data/constants';

const AppContext = createContext(null);

// ── Map API rows (snake_case, DECIMAL strings) to the objects used by the UI ──
const normalizeTx = (t) => ({
  id: t.id, amount: parseFloat(t.amount), date: t.date,
  type: t.type, description: t.description,
  paymentMethod: t.payment_method,
  categoryId: t.category_id,
  companyId: t.company_id,
  userId: t.user_id,
  receiptUrl: t.receipt_url ?? null,
  isAnomaly: Boolean(t.is_anomaly),
  categoryName: t.category_name, categoryColor: t.category_color, categoryIcon: t.category_icon,
});
const normalizeBudget = (b) => ({
  id: b.id, amount: parseFloat(b.amount), month: b.month, year: b.year,
  categoryId: b.category_id, companyId: b.company_id,
  categoryName: b.category_name, categoryColor: b.category_color, categoryIcon: b.category_icon,
});
const normalizeCat = (c) => ({
  id: c.id, name: c.name, type: c.type, color: c.color, icon: c.icon, companyId: c.company_id,
});

const toPayload = (d) => ({
  amount: d.amount, date: d.date, type: d.type, description: d.description,
  paymentMethod: d.paymentMethod, categoryId: d.categoryId, receiptUrl: d.receiptUrl || null,
});

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [anomalies, setAnomalies]       = useState([]);
  const [loading, setLoading]           = useState(false);
  const [loadError, setLoadError]       = useState('');

  const anomalyIds = useMemo(() => new Set(anomalies.map(a => a.id)), [anomalies]);

  const refreshAnomalies = useCallback(async () => {
    try { setAnomalies((await anomaliesAPI.getAll()).data); } catch { /* keep previous list */ }
  }, []);

  // Fetch everything the pages need for the signed-in user's company
  const fetchAll = async () => {
    const [txRes, budRes, catRes, anoRes] = await Promise.all([
      transactionsAPI.getAll(), budgetsAPI.getAll(), categoriesAPI.getAll(), anomaliesAPI.getAll(),
    ]);
    return {
      transactions: txRes.data.map(normalizeTx),
      budgets: budRes.data.map(normalizeBudget),
      categories: catRes.data.map(normalizeCat),
      anomalies: anoRes.data,
    };
  };
  const apply = (d) => {
    setTransactions(d.transactions); setBudgets(d.budgets); setCategories(d.categories); setAnomalies(d.anomalies);
  };

  // When a different user signs in (or signs out), drop the previous company's data.
  // Done during render, as recommended by React, instead of in an effect.
  const userId = currentUser?.id ?? null;
  const [loadedFor, setLoadedFor] = useState(null);
  const [attempt, setAttempt] = useState(0);
  if (loadedFor !== userId) {
    setLoadedFor(userId);
    setTransactions([]); setBudgets([]); setCategories([]); setAnomalies([]);
    setLoadError(''); setLoading(Boolean(userId));
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false; // ignore a slow response that arrives after the user changed
    fetchAll()
      .then(d => { if (!cancelled) apply(d); })
      .catch(err => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, attempt]);

  const reload = () => { setLoading(true); setLoadError(''); setAttempt(n => n + 1); };

  // ── Transactions ─────────────────────────────────────────────
  // Each action returns an error message, or null on success, so forms can stay open on failure.
  const saveTransaction = async (id, data) => {
    try {
      const res = id ? await transactionsAPI.update(id, toPayload(data)) : await transactionsAPI.create(toPayload(data));
      const tx = normalizeTx(res.data);
      setTransactions(p => id ? p.map(t => t.id === id ? tx : t) : [tx, ...p]);
      // Other records' flags can change too when category statistics change, so the UI
      // highlights anomalies from the refreshed anomaly list (anomalyIds).
      await refreshAnomalies();
      if (tx.isAnomaly && tx.type === 'expense')
        toast.warning(`Anomaly detected: ${tx.description} is unusually high for ${tx.categoryName}.`);
      else toast.success(id ? 'Transaction updated.' : 'Transaction saved.');
      return null;
    } catch (err) { return err.message; }
  };

  const deleteTransaction = async (id) => {
    try {
      await transactionsAPI.delete(id);
      setTransactions(p => p.filter(t => t.id !== id));
      await refreshAnomalies();
      toast.warning('Transaction deleted.');
    } catch (err) { toast.error('Delete failed: ' + err.message); }
  };

  // ── Budgets ──────────────────────────────────────────────────
  const saveBudget = async (id, data) => {
    try {
      if (id) {
        const res = await budgetsAPI.update(id, { amount: data.amount });
        setBudgets(p => p.map(b => b.id === id ? { ...b, ...normalizeBudget(res.data), categoryName: b.categoryName } : b));
      } else {
        const res = await budgetsAPI.create(data);
        const b = normalizeBudget(res.data);
        setBudgets(p => [...p.filter(x => x.id !== b.id), b]);
      }
      toast.success('Budget saved.');
      return null;
    } catch (err) { return err.message; }
  };

  const deleteBudget = async (id) => {
    try {
      await budgetsAPI.delete(id);
      setBudgets(p => p.filter(b => b.id !== id));
      toast.warning('Budget removed.');
    } catch (err) { toast.error('Delete failed: ' + err.message); }
  };

  // ── Categories ───────────────────────────────────────────────
  const saveCategory = async (id, data) => {
    try {
      const res = id ? await categoriesAPI.update(id, data) : await categoriesAPI.create(data);
      const c = normalizeCat(res.data);
      setCategories(p => id ? p.map(x => x.id === id ? c : x) : [...p, c]);
      toast.success(id ? 'Category updated.' : 'Category created.');
      return null;
    } catch (err) { return err.message; }
  };

  const deleteCategory = async (id) => {
    try {
      await categoriesAPI.delete(id);
      setCategories(p => p.filter(c => c.id !== id));
      setBudgets(p => p.filter(b => b.categoryId !== id));
      toast.warning('Category deleted.');
    } catch (err) { toast.error(err.message); }
  };

  // ── Helpers ──────────────────────────────────────────────────
  const getCategorySpending = useCallback((categoryId, month, year) =>
    transactions
      .filter(t => t.categoryId === categoryId && t.type === 'expense' && monthOf(t.date) === month && yearOf(t.date) === year)
      .reduce((s, t) => s + t.amount, 0), [transactions]);

  const getMonthlySummary = useCallback((month, year) => {
    const inMonth = transactions.filter(t => monthOf(t.date) === month && yearOf(t.date) === year);
    const income = inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, net: income - expenses, count: inMonth.length };
  }, [transactions]);

  return (
    <AppContext.Provider value={{
      transactions, budgets, categories, anomalies, anomalyIds, loading, loadError,
      saveTransaction, deleteTransaction, saveBudget, deleteBudget, saveCategory, deleteCategory,
      getCategorySpending, getMonthlySummary, reload,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);
