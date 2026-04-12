import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import AppShell from './layouts/AppShell';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/DashboardPage';
import AdmissionsPage from './Pages/AdmissionsPage';
import IdCardsPage from './Pages/IdCardsPage';
import ReportCardsPage from './Pages/ReportCardsPage';
import MastersPage from './Pages/MastersPage';
import UsersPage from './Pages/UsersPage';
import SettingsPage from './Pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
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