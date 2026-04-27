// SmartSpend Mock Data — Bahraini SME Context (BHD Currency)

export const companies = [
  { id: 1, name: 'Al-Zain Trading Co.', industry: 'Retail & Trading', location: 'Manama' },
  { id: 2, name: 'Gulf Tech Solutions', industry: 'Information Technology', location: 'Seef' },
];

export const users = [
  { id: 1, name: 'Ahmed Al-Zain', email: 'owner@alzain.bh', role: 'owner', companyId: 1, avatar: 'AZ' },
  { id: 2, name: 'Fatima Hassan', email: 'accountant@alzain.bh', role: 'employee', companyId: 1, avatar: 'FH' },
  { id: 3, name: 'Khalid Al-Mansoori', email: 'admin@smartspend.bh', role: 'admin', companyId: null, avatar: 'KM' },
  { id: 4, name: 'Sara Al-Dossari', email: 'owner@gulftech.bh', role: 'owner', companyId: 2, avatar: 'SD' },
];

export const categories = [
  // Expense categories
  { id: 1, name: 'Salaries & Wages', type: 'expense', color: '#EF4444', icon: '👥', companyId: 1 },
  { id: 2, name: 'Rent & Utilities', type: 'expense', color: '#F59E0B', icon: '🏢', companyId: 1 },
  { id: 3, name: 'Marketing & Ads', type: 'expense', color: '#8B5CF6', icon: '📣', companyId: 1 },
  { id: 4, name: 'Inventory & Stock', type: 'expense', color: '#EC4899', icon: '📦', companyId: 1 },
  { id: 5, name: 'Transportation', type: 'expense', color: '#06B6D4', icon: '🚗', companyId: 1 },
  { id: 6, name: 'Office Supplies', type: 'expense', color: '#84CC16', icon: '✏️', companyId: 1 },
  // Income categories
  { id: 7, name: 'Product Sales', type: 'income', color: '#10B981', icon: '💰', companyId: 1 },
  { id: 8, name: 'Service Revenue', type: 'income', color: '#3B82F6', icon: '🔧', companyId: 1 },
  { id: 9, name: 'Consulting Fees', type: 'income', color: '#2563EB', icon: '💼', companyId: 1 },
];

// Generate transactions for the last 3 months
const today = new Date();
const getDate = (daysAgo) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const transactions = [
  // April 2026 (current month)
  { id: 1,  amount: 4500.000, date: getDate(2),  type: 'income',  categoryId: 7, description: 'Wholesale order - Al-Hawaj Group',    paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 2,  amount: 1200.000, date: getDate(3),  type: 'expense', categoryId: 1, description: 'Monthly payroll - part 1',             paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 3,  amount: 850.000,  date: getDate(4),  type: 'expense', categoryId: 2, description: 'April office rent - Manama block 317', paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 4,  amount: 320.500,  date: getDate(5),  type: 'expense', categoryId: 3, description: 'Instagram & Google Ads campaign',      paymentMethod: 'card',     companyId: 1, userId: 1 },
  { id: 5,  amount: 2100.000, date: getDate(6),  type: 'income',  categoryId: 7, description: 'Retail walk-in sales — Week 2',        paymentMethod: 'cash',     companyId: 1, userId: 2 },
  { id: 6,  amount: 1850.000, date: getDate(7),  type: 'expense', categoryId: 4, description: 'Restocking — household goods',         paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 7,  amount: 95.000,   date: getDate(8),  type: 'expense', categoryId: 5, description: 'Delivery van fuel — April',            paymentMethod: 'cash',     companyId: 1, userId: 2 },
  { id: 8,  amount: 750.000,  date: getDate(9),  type: 'income',  categoryId: 8, description: 'Installation service fee',             paymentMethod: 'card',     companyId: 1, userId: 1 },
  { id: 9,  amount: 45.750,   date: getDate(10), type: 'expense', categoryId: 6, description: 'Stationery & printer ink',             paymentMethod: 'cash',     companyId: 1, userId: 2 },
  { id: 10, amount: 600.000,  date: getDate(12), type: 'income',  categoryId: 9, description: 'Business advisory — Tamkeen workshop', paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 11, amount: 1200.000, date: getDate(13), type: 'expense', categoryId: 1, description: 'Monthly payroll - part 2',             paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 12, amount: 180.000,  date: getDate(14), type: 'expense', categoryId: 2, description: 'Electricity & water bill — April',     paymentMethod: 'transfer', companyId: 1, userId: 2 },
  // March 2026
  { id: 13, amount: 5200.000, date: getDate(28), type: 'income',  categoryId: 7, description: 'Wholesale order — Ramadan season',     paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 14, amount: 2400.000, date: getDate(30), type: 'expense', categoryId: 1, description: 'March payroll',                        paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 15, amount: 850.000,  date: getDate(31), type: 'expense', categoryId: 2, description: 'March rent',                           paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 16, amount: 480.000,  date: getDate(32), type: 'expense', categoryId: 3, description: 'Ramadan promotional campaign',         paymentMethod: 'card',     companyId: 1, userId: 1 },
  { id: 17, amount: 2950.000, date: getDate(33), type: 'expense', categoryId: 4, description: 'Ramadan stock restocking',             paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 18, amount: 1100.000, date: getDate(35), type: 'income',  categoryId: 8, description: 'Maintenance contracts — Q1',           paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 19, amount: 320.000,  date: getDate(37), type: 'income',  categoryId: 9, description: 'SME consulting session x4',            paymentMethod: 'cash',     companyId: 1, userId: 1 },
  { id: 20, amount: 72.300,   date: getDate(40), type: 'expense', categoryId: 5, description: 'Delivery fuel — March',                paymentMethod: 'cash',     companyId: 1, userId: 2 },
  // February 2026
  { id: 21, amount: 4100.000, date: getDate(58), type: 'income',  categoryId: 7, description: 'February sales total',                 paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 22, amount: 2400.000, date: getDate(59), type: 'expense', categoryId: 1, description: 'February payroll',                     paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 23, amount: 850.000,  date: getDate(60), type: 'expense', categoryId: 2, description: 'February rent',                        paymentMethod: 'transfer', companyId: 1, userId: 2 },
  { id: 24, amount: 250.000,  date: getDate(62), type: 'expense', categoryId: 3, description: 'Social media ads — February',          paymentMethod: 'card',     companyId: 1, userId: 1 },
  { id: 25, amount: 1600.000, date: getDate(65), type: 'expense', categoryId: 4, description: 'Stock replenishment — February',       paymentMethod: 'transfer', companyId: 1, userId: 1 },
  { id: 26, amount: 900.000,  date: getDate(66), type: 'income',  categoryId: 8, description: 'Service contracts renewal',            paymentMethod: 'transfer', companyId: 1, userId: 1 },
];

export const budgets = [
  { id: 1, categoryId: 1, amount: 2500.000, month: 4, year: 2026, companyId: 1 },
  { id: 2, categoryId: 2, amount: 1100.000, month: 4, year: 2026, companyId: 1 },
  { id: 3, categoryId: 3, amount: 400.000,  month: 4, year: 2026, companyId: 1 },
  { id: 4, categoryId: 4, amount: 2000.000, month: 4, year: 2026, companyId: 1 },
  { id: 5, categoryId: 5, amount: 150.000,  month: 4, year: 2026, companyId: 1 },
  { id: 6, categoryId: 6, amount: 80.000,   month: 4, year: 2026, companyId: 1 },
];

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const PAYMENT_METHODS = ['cash', 'card', 'transfer'];

export const ROLES = {
  owner: { label: 'Business Owner', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  admin: { label: 'Administrator',  color: 'text-brand-300 bg-brand-500/10 border-brand-500/30' },
  employee: { label: 'Employee',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
};

// Demo credentials
export const DEMO_CREDENTIALS = [
  { email: 'owner@alzain.bh',      password: 'owner123',  userId: 1 },
  { email: 'accountant@alzain.bh', password: 'emp123',    userId: 2 },
  { email: 'admin@smartspend.bh',  password: 'admin123',  userId: 3 },
];
