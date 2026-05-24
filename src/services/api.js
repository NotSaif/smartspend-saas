/**
 * SmartSpend API Service Layer
 * Centralises all HTTP calls to the backend.
 * Automatically attaches JWT token from localStorage.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helpers ───────────────────────────────────────────────────

const getToken = () => localStorage.getItem('smartspend_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();

  // Global 401 handler — token expired or invalid
  if (res.status === 401 && path !== '/auth/login') {
    localStorage.removeItem('smartspend_token');
    sessionStorage.removeItem('smartspend_user');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Auth ──────────────────────────────────────────────────────

export const authAPI = {
  login:          (email, password)              => request('POST', '/auth/login',           { email, password }),
  register:       (payload)                      => request('POST', '/auth/register',         payload),
  me:             ()                             => request('GET',  '/auth/me'),
  updateProfile:  (name, email)                  => request('PUT',  '/auth/profile',          { name, email }),
  changePassword: (currentPassword, newPassword) => request('POST', '/auth/change-password',  { currentPassword, newPassword }),
};

// ── Transactions ──────────────────────────────────────────────

export const transactionsAPI = {
  getAll:  (params = {}) => request('GET',    '/transactions?' + new URLSearchParams(params)),
  getById: (id)          => request('GET',    `/transactions/${id}`),
  create:  (data)        => request('POST',   '/transactions',       data),
  update:  (id, data)    => request('PUT',    `/transactions/${id}`, data),
  delete:  (id)          => request('DELETE', `/transactions/${id}`),
};

// ── Budgets ───────────────────────────────────────────────────

export const budgetsAPI = {
  getAll:  (params = {}) => request('GET',    '/budgets?' + new URLSearchParams(params)),
  create:  (data)        => request('POST',   '/budgets',       data),
  update:  (id, data)    => request('PUT',    `/budgets/${id}`, data),
  delete:  (id)          => request('DELETE', `/budgets/${id}`),
};

// ── Categories ────────────────────────────────────────────────

export const categoriesAPI = {
  getAll:  ()        => request('GET',    '/categories'),
  create:  (data)    => request('POST',   '/categories',       data),
  update:  (id, d)   => request('PUT',    `/categories/${id}`, d),
  delete:  (id)      => request('DELETE', `/categories/${id}`),
};

// ── Users (admin) ─────────────────────────────────────────────

export const usersAPI = {
  getAll:  ()        => request('GET',    '/users'),
  create:  (data)    => request('POST',   '/users',       data),
  update:  (id, d)   => request('PUT',    `/users/${id}`, d),
  delete:  (id)      => request('DELETE', `/users/${id}`),
};

// ── Companies (admin) ─────────────────────────────────────────

export const companiesAPI = {
  getAll:  ()        => request('GET',    '/companies'),
  create:  (data)    => request('POST',   '/companies',       data),
  update:  (id, d)   => request('PUT',    `/companies/${id}`, d),
  delete:  (id)      => request('DELETE', `/companies/${id}`),
};

// ── Reports ───────────────────────────────────────────────────

export const reportsAPI = {
  monthly:    (year)          => request('GET', `/reports/monthly?year=${year}`),
  byCategory: (year, month)   => request('GET', `/reports/by-category?year=${year}${month ? `&month=${month}` : ''}`),
  summary:    (month, year)   => request('GET', `/reports/summary?month=${month}&year=${year}`),
};

// ── Anomaly Detection ─────────────────────────────────────────

export const anomaliesAPI = {
  getAll: () => request('GET', '/anomalies'),
};

// ── Receipt OCR ───────────────────────────────────────────────
// Uses FormData (multipart) — no Content-Type header so browser sets boundary.

export const receiptsAPI = {
  ocr: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return fetch(`${BASE_URL}/receipts/ocr`, {
      method: 'POST',
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OCR failed');
      return data;
    });
  },
};
