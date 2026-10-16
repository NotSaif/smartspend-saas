# SmartSpend 🇧🇭
### AI-Enhanced Multi-Tenant Financial Tracking and Anomaly Detection System for SMEs in Bahrain

> IT graduation project (CSC426) — Applied Science University, Bahrain.

SmartSpend lets small and medium-sized businesses record income and expenses in Bahraini Dinars, set monthly
budgets, scan receipts, and get automatic alerts when an expense is statistically unusual. Every company is a
separate tenant: its data is isolated by a `company_id` taken from the signed-in user, never from the request.

---

## Features
| Feature | Details |
|---------|---------|
| Company registration | A new business registers its company and Business Owner account in one step (14 default categories are created). |
| Role-based access | **Business Owner** — everything, including user management · **Administrator** — all financial data, no user management · **Employee** — read-only. Enforced by the API and the UI. |
| Transactions | Income/expenses with BHD 3-decimal precision; search and filter by type, category, method, date range, amount and anomaly status. |
| Receipt OCR | Upload a receipt photo; Tesseract.js reads the vendor, total (ignoring subtotal/VAT lines) and date. |
| Anomaly detection | Z-score per expense category: flagged when `z = (x − μ) / σ > 2` (≥ 3 records), fallback `x > 1.5 × μ` (< 3 records). Stored in `transactions.is_anomaly`. |
| Budgets | Monthly limit per expense category; alerts at 90% and when exceeded. |
| Dashboard & reports | Chart.js charts, anomaly and budget alerts, monthly and category reports with CSV export and print/PDF. |
| Security | JWT (24 h), bcrypt, rate limiting, CORS, security headers, parameterised SQL, input validation. |

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 3, Chart.js 4 |
| Backend | Node.js (≥ 18), Express 4, node-postgres, Tesseract.js, multer |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Deployment | Vercel (frontend) + Render (API + PostgreSQL) via `render.yaml` |

---

## Running Locally
**Prerequisites:** Node.js 18+ and PostgreSQL.

```bash
# Backend
cd backend
cp .env.example .env          # set your PostgreSQL credentials and a JWT_SECRET
npm install
npm run db:migrate            # create / upgrade the tables
npm run db:seed               # demo companies (re-running resets them)
npm run dev                   # → http://localhost:5000

# Frontend (in a second terminal, from the project root)
npm install
npm run dev                   # → http://localhost:5173  (proxies /api to port 5000)
```

## Demo Accounts (Al-Zain Trading Co.)
| Role | Email | Password |
|------|-------|----------|
| Business Owner | owner@alzain.bh | owner123 |
| Administrator | admin@alzain.bh | admin123 |
| Employee | accountant@alzain.bh | emp123 |

A second demo company, **Gulf Tech Solutions** (`owner@gulftech.bh` / `owner123`), shows that tenants cannot see each other's data.

---

## API Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public — new company + owner |
| POST | /api/auth/login | Public (10 attempts / 15 min) |
| GET | /api/auth/me · PUT /api/auth/profile · POST /api/auth/change-password | Signed in |
| GET | /api/transactions (filters: type, categoryId, paymentMethod, startDate, endDate, minAmount, maxAmount, anomaly, search) | Signed in |
| POST · PUT · DELETE | /api/transactions[/:id] | Owner, Admin |
| GET | /api/anomalies | Signed in |
| POST | /api/receipts/ocr | Owner, Admin |
| GET | /api/budgets · POST · PUT · DELETE /api/budgets[/:id] | Read: signed in · Write: Owner, Admin |
| GET | /api/categories · POST · PUT · DELETE /api/categories[/:id] | Read: signed in · Write: Owner, Admin |
| GET | /api/reports/summary · /monthly · /by-category | Owner, Admin |
| GET · PUT | /api/companies/me | Read: signed in · Write: Owner |
| GET · POST · PUT · DELETE | /api/users[/:id] | Owner (own company) |
| GET | /api/health | Public |

## Deployment
- **Frontend → Vercel:** import the repo; set `VITE_API_URL` to the Render API URL (e.g. `https://smartspend-api.onrender.com/api`).
- **Backend + DB → Render:** create a Blueprint from `render.yaml`; set `CLIENT_URL` to the Vercel URL, then run `npm run db:migrate` and `npm run db:seed` once from the Render shell.

## Project Structure
```
├── src/                     React frontend
│   ├── components/          Layout, StatCard, BudgetBar, TransactionModal, ConfirmDialog, Toast
│   ├── context/             AuthContext (session), AppContext (company data + mapping)
│   ├── data/constants.js    Months, roles, demo accounts, formatting helpers
│   ├── pages/               Landing, Login/Register, Dashboard, Transactions, Budgets,
│   │                        Reports, Categories, Users, Profile, NotFound
│   └── services/api.js      REST client
├── backend/
│   ├── db/                  pool, migrate, seed
│   ├── lib/                 anomalies (z-score engine), http helpers
│   ├── middleware/auth.js   JWT authentication + role authorisation
│   └── routes/              auth, transactions, budgets, categories, reports,
│                            anomalies, receipts, users, companies
├── vercel.json · render.yaml
```
