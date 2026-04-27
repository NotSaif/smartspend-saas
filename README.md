# SmartSpend 🇧🇭
### Web-Based Budget Management & Financial Tracking System for SMEs in Bahrain

> Built for IT graduation project. Aligned with Bahrain Vision 2030 digital financial inclusion goals.

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS v3, Chart.js, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Deployment | Vercel (frontend) + Render (backend + DB) |

---

## Quick Start

### 1. Frontend (Phase 1 — Mock Data)
```bash
cd smartspend
npm install
npm run dev
# → http://localhost:5173
```

### 2. Backend (Phase 2 — Real Database)
**Prerequisites:** PostgreSQL installed and running locally.

```bash
# 1. Set up environment
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 2. Install dependencies
npm install

# 3. Run database migrations
npm run db:migrate

# 4. Seed demo data
npm run db:seed

# 5. Start backend
npm run dev
# → http://localhost:5000
```

Then open the frontend — it automatically tries the real API and falls back to mock data if the backend is unavailable.

---

## Demo Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Business Owner | owner@alzain.bh | owner123 |
| Administrator | admin@smartspend.bh | admin123 |
| Employee | accountant@alzain.bh | emp123 |

---

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/register | Register new user |
| GET | /api/transactions | List transactions (filterable) |
| POST | /api/transactions | Create transaction |
| PUT | /api/transactions/:id | Update transaction |
| DELETE | /api/transactions/:id | Delete transaction |
| GET | /api/budgets | Budgets with live spending |
| POST | /api/budgets | Set budget |
| GET | /api/categories | List categories |
| GET | /api/reports/monthly | Monthly summary |
| GET | /api/reports/by-category | Category breakdown |
| GET | /api/reports/summary | Dashboard summary |

---

## Deployment

### Frontend → Vercel
```bash
cd smartspend
npx vercel --prod
```
Set `VITE_API_URL` in Vercel environment variables to your Render backend URL.

### Backend → Render
Push to GitHub, then connect the repo to Render using `render.yaml`.
Set the `JWT_SECRET` and `CLIENT_URL` environment variables in the Render dashboard.

---

## Project Structure
```
smartspend/
├── src/                    # React frontend
│   ├── components/         # Layout, StatCard, BudgetBar, Toast, Modal
│   ├── context/            # AuthContext, AppContext
│   ├── data/               # Mock data (Bahraini SME)
│   ├── pages/              # All 9 pages
│   └── services/api.js     # Backend API layer
├── backend/                # Express backend
│   ├── db/                 # Pool, migrate, seed
│   ├── middleware/         # JWT auth, RBAC
│   └── routes/             # auth, transactions, budgets, categories, users, reports
├── vercel.json             # Frontend deployment
└── render.yaml             # Backend + DB deployment
```

---

*SmartSpend — Empowering Bahrain's SMEs with Real-Time Financial Intelligence*
