import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SchoolsPage from './pages/SchoolsPage';
import UsersPage from './pages/UsersPage';
import StudentsPage from './pages/StudentsPage';
import TemplatesPage from './pages/TemplatesPage';
import IdCardsPage from './pages/IdCardsPage';
import EditRequestsPage from './pages/EditRequestsPage';
import PublicStudentEditPage from './pages/PublicStudentEditPage';

function PrivateRoute({ children }) {
  const { user } = useAppContext();
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/public/student-edit/:token" element={<PublicStudentEditPage />} />
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="schools" element={<SchoolsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="id-cards" element={<IdCardsPage />} />
        <Route path="edit-requests" element={<EditRequestsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
