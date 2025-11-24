// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import User from "./pages/User";
import Login from "./components/Login";
import ImageUploader from "./components/ImageUploader";
import Courses from "./pages/Courses";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import Students from "./pages/Students";
import CanvasEditor from "./components/CanvasEditor";
import ErrorBoundary from "./components/ErrorBoundary";
import TemplateGallery from "./pages/TemplateGallery";
import TemplateManager from "./pages/TemplateManager";
import AddTemplate from "./Pages/addTemplate";
import AddCategory from "./pages/addCategory";
import AddSubcategory from "./pages/addSubcategory";
import CanvaHome from "./Pages/canvaHome";
import Subcategory from "./Pages/Subcategory";
import AddGallary from "./Pages/addGallary";

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

      {/* 🖌️ Canva-like Editor Routes – ALL use CanvasEditor */}
      <Route
        path="/CanvasEditor"
        element={
          <ErrorBoundary>
            <CanvasEditor />
          </ErrorBoundary>
        }
      />
      <Route
        path="/editor/:templateId"
        element={
          <ErrorBoundary>
            <CanvasEditor />
          </ErrorBoundary>
        }
      />
      {/* Backward compatibility: old URL also uses the SAME editor */}
      <Route
        path="/template-editor/:templateId"
        element={
          <ErrorBoundary>
            <CanvasEditor />
          </ErrorBoundary>
        }
      />

      {/* 🎨 Template selection / home */}
      <Route path="templates" element={<TemplateGallery />} />
      <Route path="/home" element={<CanvaHome />} />
      <Route path="/subcategory/:categoryId" element={<Subcategory />} />
      <Route path="addTemplate" element={<AddTemplate />} />

      {/* 🔐 Protected Routes under :username */}
      <Route
        path="/:username"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="user" element={<User />} />
        <Route path="courses" element={<Courses />} />
        <Route path="students" element={<Students />} />

        {/* Template manager & admin-only design helpers */}
        <Route path="Gallary" element={<AddGallary />} />
        <Route path="addTemplate" element={<AddTemplate />} />
        <Route path="addCategory" element={<AddCategory />} />
        <Route path="addSubcategory" element={<AddSubcategory />} />
        <Route path="templateManager" element={<TemplateManager />} />
      </Route>

      {/* 🧭 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
