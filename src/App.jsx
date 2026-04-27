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
import Companies     from './pages/Companies';
import Profile       from './pages/Profile';
import NotFound      from './pages/NotFound';

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      }/>
      <Route path="/transactions" element={
        <ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>
      }/>
      <Route path="/budgets" element={
        <ProtectedRoute allowedRoles={['owner','admin']}><Layout><Budgets /></Layout></ProtectedRoute>
      }/>
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['owner','admin']}><Layout><Reports /></Layout></ProtectedRoute>
      }/>
      <Route path="/categories" element={
        <ProtectedRoute allowedRoles={['admin']}><Layout><Categories /></Layout></ProtectedRoute>
      }/>
      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['admin']}><Layout><Users /></Layout></ProtectedRoute>
      }/>
      <Route path="/companies" element={
        <ProtectedRoute allowedRoles={['admin']}><Layout><Companies /></Layout></ProtectedRoute>
      }/>
      <Route path="/profile" element={
        <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
      }/>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
