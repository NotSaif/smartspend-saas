import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LandingPage   from './pages/LandingPage';
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Transactions  from './pages/Transactions';
import Budgets       from './pages/Budgets';
import Reports       from './pages/Reports';
import Categories    from './pages/Categories';
import Users         from './pages/Users';
import Profile       from './pages/Profile';
import NotFound      from './pages/NotFound';

const page = (element, roles) => (
  <ProtectedRoute allowedRoles={roles}><Layout>{element}</Layout></ProtectedRoute>
);

export default function App() {
  const { currentUser } = useAuth();
  const guestOnly = (element) => (currentUser ? <Navigate to="/dashboard" replace /> : element);

  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={guestOnly(<Login mode="login" />)} />
      <Route path="/register" element={guestOnly(<Login mode="register" />)} />

      <Route path="/dashboard"    element={page(<Dashboard />)} />
      <Route path="/transactions" element={page(<Transactions />)} />
      <Route path="/budgets"      element={page(<Budgets />,    ['owner', 'admin'])} />
      <Route path="/reports"      element={page(<Reports />,    ['owner', 'admin'])} />
      <Route path="/categories"   element={page(<Categories />, ['owner', 'admin'])} />
      <Route path="/users"        element={page(<Users />,      ['owner'])} />
      <Route path="/profile"      element={page(<Profile />)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
