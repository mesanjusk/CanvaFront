import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './Pages/Dashboard';
import User from './Pages/User';
import Login from './components/Login';
import ImageUploader from './components/ImageUploader';
import Enquiry from './Pages/Enquiry';
import Courses from './Pages/Courses';
import Batches from './Pages/Batches';
import Signup from './components/Signup';
import OrgCategories from './Pages/OrgCategories';
import Education from './Pages/Education';
import Exam from './Pages/Exam';
import PaymentMode from './Pages/PaymentMode';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import InstituteProfile from './Pages/instituteProfile';
import Owner from './Pages/Owner';
import PrivateRoute from './components/PrivateRoute';
import CoursesCategory from './Pages/CoursesCategory';
import Leads from './reports/Leads';
import AllAdmission from './reports/allAdmission';
import AddLead from './Pages/AddLead';
import AddNew from './components/admissions/AddAdmission';
import Followup from './Pages/Followup';
import WhatsAppAdminPage from './Pages/WhatsAppAdminPage';
import AddReciept from './Pages/addReciept';
import AddPayment from './Pages/addPayment';
import AllLeadByAdmission from './reports/allLeadByAdmission';
import AddAttendance from './Pages/AddAttendance';
import AllAttendance from './reports/allAttendance';
import AllBatches from './reports/allBatches';
import AllBalance from './reports/allBalance';
import AddAccount from './Pages/AddAccount';
import AllExams from './reports/allExams';
import Institutes from './Pages/Institutes';
import Students from './Pages/Students';
import Fees from './Pages/Fees';
import ToolsPanel from './Pages/ToolsPanel';
import CanvasEditor from './components/CanvasEditor';
import ErrorBoundary from './components/ErrorBoundary';
import TemplateGallery from './Pages/TemplateGallery';
import TemplateManager from './Pages/TemplateManager';
import AddTemplate from './Pages/addTemplate';
import AddCategory from './Pages/addCategory';
import AddSubcategory from './Pages/addSubcategory';
import BulkGenerator from './Pages/BulkGenerator';
import VideoEditor from './Pages/VideoEditor';
import PrintLayout from './Pages/PrintLayout';
import CanvaHome from './Pages/canvaHome';
import Subcategory from './Pages/Subcategory';
import AddGallary from './Pages/addGallary';
import TemplateEditor from './Pages/templateEditor';

export default function App() {
  return (
    <Routes>
      {/* 🌐 Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/upload" element={<ImageUploader />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:id" element={<ResetPassword />} />
      <Route path="/CanvasEditor" element={<ErrorBoundary><CanvasEditor /></ErrorBoundary>} />
      <Route path="/editor/:templateId" element={<ErrorBoundary><CanvasEditor /></ErrorBoundary>} />
      <Route path="templates" element={<TemplateGallery />} />
      <Route path="/home" element={<CanvaHome />} />
      <Route path="/subcategory/:categoryId" element={<Subcategory />} />
      <Route path="/template-editor/:id" element={<TemplateEditor />} />

      {/* 🔐 Protected Routes under :username */}
      <Route path="/:username" element={<PrivateRoute><DashboardLayout /></PrivateRoute>} >
        <Route index element={<Dashboard />} />
        <Route path="user" element={<User />} />
        <Route path="batches" element={<Batches />} />
        <Route path="enquiry" element={<Enquiry />} />
        <Route path="courses" element={<Courses />} />
        <Route path="students" element={<Students />} />
        <Route path="orgcategories" element={<OrgCategories />} />
        <Route path="education" element={<Education />} />
        <Route path="exam" element={<Exam />} />
        <Route path="paymentmode" element={<PaymentMode />} />
        <Route path="instituteProfile" element={<InstituteProfile />} />
        <Route path="owner" element={<Owner />} />
        <Route path="institutes" element={<Institutes />} />
        <Route path="coursesCategory" element={<CoursesCategory />} />
        <Route path="leads" element={<Leads />} />
        <Route path="allAdmission" element={<AllAdmission />} />
        <Route path="allLeadByAdmission" element={<AllLeadByAdmission />} />
        <Route path="add-lead" element={<AddLead />} />
        <Route path="addNewAdd" element={<AddNew />} />
        <Route path="addReciept" element={<AddReciept />} />
        <Route path="addPayment" element={<AddPayment />} />
        <Route path="addAccount" element={<AddAccount />} />
        <Route path="followup" element={<Followup />} />
        <Route path="addAttendance" element={<AddAttendance />} />
        <Route path="allAttendance" element={<AllAttendance />} />
        <Route path="allBalance" element={<AllBalance />} />
        <Route path="allBatches" element={<AllBatches />} />
        <Route path="whatsapp" element={<WhatsAppAdminPage />} />
        <Route path="allExams" element={<AllExams />} />
        <Route path="fees" element={<Fees />} />
        <Route path="tools" element={<ToolsPanel />} />
        <Route path="video" element={<VideoEditor />} />
        <Route path="print-layout" element={<PrintLayout />} />
        
          <Route path="Gallary" element={<AddGallary />} />
          <Route path="addTemplate" element={<AddTemplate />} />
          <Route path="addCategory" element={<AddCategory />} />
          <Route path="addSubcategory" element={<AddSubcategory />} />
      <Route path="templateManager" element={<TemplateManager />} />
      </Route>

      <Route path="/:username/bulk" element={<PrivateRoute><BulkGenerator /></PrivateRoute>} />

      {/* 🧭 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
