import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import AppShell from './layouts/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdmissionsPage from './pages/AdmissionsPage';
import IdCardsPage from './pages/IdCardsPage';
import ReportCardsPage from './pages/ReportCardsPage';
import MastersPage from './pages/MastersPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="admissions" element={<AdmissionsPage />} />
        <Route path="id-cards" element={<IdCardsPage />} />
        <Route path="report-cards" element={<ReportCardsPage />} />
        <Route path="masters" element={<MastersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
