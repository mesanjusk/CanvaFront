import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './Pages/LoginPage';
import DashboardPage from './Pages/DashboardPage';
import SchoolsPage from './Pages/SchoolsPage';
import UsersPage from './Pages/UsersPage';
import StudentsPage from './Pages/StudentsPage';
import TemplatesPage from './Pages/TemplatesPage';
import IdCardsPage from './Pages/IdCardsPage';
import EditRequestsPage from './Pages/EditRequestsPage';
import PublicStudentEditPage from './Pages/PublicStudentEditPage';

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
