import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '../components/Toast';
import { transactionsAPI, budgetsAPI, categoriesAPI, usersAPI, companiesAPI } from '../services/api';
import {
  transactions as mockTx,
  budgets as mockBudgets,
  categories as mockCats,
  users as mockUsers,
  companies as mockCompanies,
} from '../data/mockData';

const AppContext = createContext(null);

const isRealAPI = () => !!localStorage.getItem('smartspend_token');

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets]           = useState([]);
  const [categories, setCategories]     = useState([]);
  const [users, setUsers]               = useState([]);
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);

  // ── Load data ────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    if (isRealAPI()) {
      try {
        const [txRes, budRes, catRes] = await Promise.all([
          transactionsAPI.getAll(),
          budgetsAPI.getAll(),
          categoriesAPI.getAll(),
        ]);
        setTransactions(txRes.data.map(normalizeTx));
        setBudgets(budRes.data.map(normalizeBudget));
        setCategories(catRes.data.map(normalizeCat));

        // Load companies (best-effort — admins see all, others see own)
        try {
          const coRes = await companiesAPI.getAll();
          setCompanies(coRes.data);
        } catch { setCompanies(mockCompanies); }

        // Load users (admin only — may fail for others)
        try {
          const usrRes = await usersAPI.getAll();
          setUsers(usrRes.data.map(normalizeUser));
        } catch { setUsers(mockUsers); }
      } catch (err) {
        console.warn('API load failed, falling back to mock data', err);
        loadMock();
      }
    } else {
      loadMock();
    }
    setLoading(false);
  }, []);

  const loadMock = () => {
    setTransactions(mockTx);
    setBudgets(mockBudgets);
    setCategories(mockCats);
    setUsers(mockUsers);
    setCompanies(mockCompanies);
  };

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Normalize API responses to match frontend shape ──────────
  const formatDate = (d) => d ? (typeof d === 'string' ? d.substring(0, 10) : d) : d;

  const normalizeTx = (t) => ({
    id: t.id, amount: parseFloat(t.amount), date: formatDate(t.date),
    type: t.type, description: t.description,
    paymentMethod: t.payment_method || t.paymentMethod,
    categoryId: t.category_id ?? t.categoryId,
    companyId: t.company_id ?? t.companyId,
    userId: t.user_id ?? t.userId,
    categoryName: t.category_name, categoryColor: t.category_color, categoryIcon: t.category_icon,
  });
  const normalizeBudget = (b) => ({
    id: b.id, amount: parseFloat(b.amount), month: b.month, year: b.year,
    categoryId: b.category_id ?? b.categoryId,
    companyId: b.company_id ?? b.companyId,
    spent: parseFloat(b.spent || 0),
    categoryName: b.category_name, categoryColor: b.category_color, categoryIcon: b.category_icon,
  });
  const normalizeCat = (c) => ({
    id: c.id, name: c.name, type: c.type, color: c.color,
    icon: c.icon, companyId: c.company_id ?? c.companyId,
  });
  const normalizeUser = (u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    companyId: u.company_id ?? u.companyId, avatar: u.avatar,
  });

  // ── Transactions ─────────────────────────────────────────────
  const addTransaction = async (data) => {
    if (isRealAPI()) {
      try {
        const res = await transactionsAPI.create({
          amount: data.amount, date: data.date, type: data.type,
          description: data.description, paymentMethod: data.paymentMethod,
          categoryId: data.categoryId,
        });
        setTransactions(p => [normalizeTx(res.data), ...p]);
        toast.success('Transaction saved to database!');
      } catch (err) { toast.error('Failed to save: ' + err.message); }
    } else {
      const id = Math.max(...transactions.map(t => t.id), 0) + 1;
      setTransactions(p => [...p, { ...data, id }]);
      toast.success('Transaction added!');
    }
  };

  const updateTransaction = async (id, data) => {
    if (isRealAPI()) {
      try {
        const res = await transactionsAPI.update(id, {
          amount: data.amount, date: data.date, type: data.type,
          description: data.description, paymentMethod: data.paymentMethod,
          categoryId: data.categoryId,
        });
        setTransactions(p => p.map(t => t.id === id ? normalizeTx(res.data) : t));
        toast.success('Transaction updated.');
      } catch (err) { toast.error('Update failed: ' + err.message); }
    } else {
      setTransactions(p => p.map(t => t.id === id ? { ...t, ...data } : t));
      toast.success('Transaction updated.');
    }
  };

  const deleteTransaction = async (id) => {
    if (isRealAPI()) {
      try {
        await transactionsAPI.delete(id);
        setTransactions(p => p.filter(t => t.id !== id));
        toast.warning('Transaction deleted.');
      } catch (err) { toast.error('Delete failed: ' + err.message); }
    } else {
      setTransactions(p => p.filter(t => t.id !== id));
      toast.warning('Transaction deleted.');
    }
  };

  // ── Budgets ──────────────────────────────────────────────────
  const addBudget = async (data) => {
    if (isRealAPI()) {
      try {
        const res = await budgetsAPI.create({
          amount: data.amount, month: data.month, year: data.year,
          categoryId: data.categoryId,
        });
        setBudgets(p => [...p, normalizeBudget(res.data)]);
        toast.success('Budget set successfully!');
      } catch (err) { toast.error('Failed: ' + err.message); }
    } else {
      const id = Math.max(...budgets.map(b => b.id), 0) + 1;
      setBudgets(p => [...p, { ...data, id }]);
      toast.success('Budget set!');
    }
  };

  const updateBudget = async (id, data) => {
    if (isRealAPI()) {
      try {
        const res = await budgetsAPI.update(id, { amount: data.amount });
        setBudgets(p => p.map(b => b.id === id ? normalizeBudget(res.data) : b));
        toast.success('Budget updated.');
      } catch (err) { toast.error('Update failed: ' + err.message); }
    } else {
      setBudgets(p => p.map(b => b.id === id ? { ...b, ...data } : b));
      toast.success('Budget updated.');
    }
  };

  const deleteBudget = async (id) => {
    if (isRealAPI()) {
      try {
        await budgetsAPI.delete(id);
        setBudgets(p => p.filter(b => b.id !== id));
        toast.warning('Budget removed.');
      } catch (err) { toast.error('Delete failed: ' + err.message); }
    } else {
      setBudgets(p => p.filter(b => b.id !== id));
      toast.warning('Budget removed.');
    }
  };

  // ── Categories ────────────────────────────────────────────────
  const addCategory = async (data) => {
    if (isRealAPI()) {
      try {
        const res = await categoriesAPI.create(data);
        setCategories(p => [...p, normalizeCat(res.data)]);
        toast.success('Category created!');
      } catch (err) { toast.error('Failed: ' + err.message); }
    } else {
      const id = Math.max(...categories.map(c => c.id), 0) + 1;
      setCategories(p => [...p, { ...data, id }]);
      toast.success('Category created!');
    }
  };

  const updateCategory = async (id, data) => {
    if (isRealAPI()) {
      try {
        const res = await categoriesAPI.update(id, data);
        setCategories(p => p.map(c => c.id === id ? normalizeCat(res.data) : c));
        toast.success('Category updated.');
      } catch (err) { toast.error('Update failed: ' + err.message); }
    } else {
      setCategories(p => p.map(c => c.id === id ? { ...c, ...data } : c));
      toast.success('Category updated.');
    }
  };

  const deleteCategory = async (id) => {
    if (isRealAPI()) {
      try {
        await categoriesAPI.delete(id);
        setCategories(p => p.filter(c => c.id !== id));
        toast.warning('Category deleted.');
      } catch (err) { toast.error('Delete failed: ' + err.message); }
    } else {
      setCategories(p => p.filter(c => c.id !== id));
      toast.warning('Category deleted.');
    }
  };

  // ── Users (mock only for non-admin) ───────────────────────────
  const addUser    = (u) => { const id = Math.max(...users.map(x=>x.id),0)+1; setUsers(p=>[...p,{...u,id}]); toast.success('User added!'); };
  const updateUser = (id,d) => { setUsers(p=>p.map(u=>u.id===id?{...u,...d}:u)); toast.success('User updated.'); };
  const deleteUser = (id) => { setUsers(p=>p.filter(u=>u.id!==id)); toast.warning('User removed.'); };

  // ── Helpers ───────────────────────────────────────────────────
  const getCategorySpending = (categoryId, month, year, companyId) => {
    return transactions
      .filter(t => t.categoryId === categoryId && t.type === 'expense' &&
        (companyId === null || t.companyId === companyId) &&
        new Date(t.date).getMonth() + 1 === month &&
        new Date(t.date).getFullYear() === year)
      .reduce((s, t) => s + t.amount, 0);
  };

  const getMonthlySummary = (month, year, companyId) => {
    const filtered = transactions.filter(t =>
      (companyId === null || t.companyId === companyId) &&
      new Date(t.date).getMonth() + 1 === month &&
      new Date(t.date).getFullYear() === year
    );
    const income = filtered.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expenses = filtered.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return { income, expenses, net: income - expenses };
  };

  return (
    <AppContext.Provider value={{
      transactions, budgets, categories, users, companies, loading,
      addTransaction, updateTransaction, deleteTransaction,
      addBudget, updateBudget, deleteBudget,
      addCategory, updateCategory, deleteCategory,
      addUser, updateUser, deleteUser,
      getCategorySpending, getMonthlySummary,
      reload: loadAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
