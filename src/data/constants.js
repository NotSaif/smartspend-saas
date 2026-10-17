export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PAYMENT_METHODS = ['cash', 'card', 'transfer'];

export const ROLES = {
  owner:    { label: 'Business Owner', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  admin:    { label: 'Administrator',  color: 'text-brand-300 bg-brand-500/10 border-brand-500/30' },
  employee: { label: 'Employee',       color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
};

// Budget status thresholds (FR-10: alert when spending reaches 90% of the limit)
export const BUDGET_ALERT_PCT = 90;

// Demo company: General Trading Co. (one user per role)
export const DEMO_COMPANY = 'General Trading Co.';
export const DEMO_ACCOUNTS = [
  { name: 'Alex Morgan', role: 'Business Owner', label: 'Owner',    email: 'owner@general.bh',    password: 'owner123', color: 'emerald' },
  { name: 'Max Carter',  role: 'Administrator',  label: 'Admin',    email: 'admin@general.bh',    password: 'admin123', color: 'brand' },
  { name: 'Clara Hayes', role: 'Employee',       label: 'Employee', email: 'employee@general.bh', password: 'emp123',   color: 'amber' },
];

// A second, separate company — used to show that tenants cannot see each other's data
export const DEMO_OTHER_ACCOUNT = {
  name: 'Sam Wilson', role: 'Business Owner', label: 'Owner', company: 'Bright Tech Solutions',
  email: 'owner@brighttech.bh', password: 'owner123', color: 'cyan',
};

export const fmtBHD = (n) => `BHD ${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;

// Today's date as YYYY-MM-DD in the user's local time zone
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Month (1-12) and year of a YYYY-MM-DD string, without time-zone conversion
export const monthOf = (iso) => Number(iso.slice(5, 7));
export const yearOf = (iso) => Number(iso.slice(0, 4));
