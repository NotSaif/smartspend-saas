/**
 * SmartSpend API Service Layer
 * Centralises all HTTP calls to the backend and attaches the JWT from localStorage.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'smartspend_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

const send = async (path, options, isAuthCall) => {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error('Cannot reach the SmartSpend server. Please check your connection and try again.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty or non-JSON body */ }

  // Expired or invalid session → back to the login page
  if (res.status === 401 && !isAuthCall) {
    setToken(null);
    window.location.href = '/login';
    throw new Error('Your session has expired. Please sign in again.');
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

const request = (method, path, body) => send(path, {
  method,
  headers: {
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  },
  ...(body ? { body: JSON.stringify(body) } : {}),
}, path === '/auth/login' || path === '/auth/register');

const query = (params) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:          (email, password)              => request('POST', '/auth/login', { email, password }),
  register:       (payload)                      => request('POST', '/auth/register', payload),
  me:             ()                             => request('GET',  '/auth/me'),
  updateProfile:  (name, email)                  => request('PUT',  '/auth/profile', { name, email }),
  changePassword: (currentPassword, newPassword) => request('POST', '/auth/change-password', { currentPassword, newPassword }),
};

// ── Transactions ──────────────────────────────────────────────
export const transactionsAPI = {
  getAll:  (params = {}) => request('GET',    '/transactions' + query(params)),
  create:  (data)        => request('POST',   '/transactions', data),
  update:  (id, data)    => request('PUT',    `/transactions/${id}`, data),
  delete:  (id)          => request('DELETE', `/transactions/${id}`),
};

// ── Budgets ───────────────────────────────────────────────────
export const budgetsAPI = {
  getAll:  (params = {}) => request('GET',    '/budgets' + query(params)),
  create:  (data)        => request('POST',   '/budgets', data),
  update:  (id, data)    => request('PUT',    `/budgets/${id}`, data),
  delete:  (id)          => request('DELETE', `/budgets/${id}`),
};

// ── Categories ────────────────────────────────────────────────
export const categoriesAPI = {
  getAll:  ()      => request('GET',    '/categories'),
  create:  (data)  => request('POST',   '/categories', data),
  update:  (id, d) => request('PUT',    `/categories/${id}`, d),
  delete:  (id)    => request('DELETE', `/categories/${id}`),
};

// ── Users (Business Owner) ────────────────────────────────────
export const usersAPI = {
  getAll:  ()      => request('GET',    '/users'),
  create:  (data)  => request('POST',   '/users', data),
  update:  (id, d) => request('PUT',    `/users/${id}`, d),
  delete:  (id)    => request('DELETE', `/users/${id}`),
};

// ── Company profile ───────────────────────────────────────────
export const companyAPI = {
  get:    ()     => request('GET', '/companies/me'),
  update: (data) => request('PUT', '/companies/me', data),
};

// ── Anomaly Detection ─────────────────────────────────────────
export const anomaliesAPI = {
  getAll: () => request('GET', '/anomalies'),
};

// ── Receipt OCR (multipart — the browser sets the Content-Type boundary) ──
export const receiptsAPI = {
  ocr: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return send('/receipts/ocr', {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData,
    }, false);
  },
};
