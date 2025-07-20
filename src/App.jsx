import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import CanvasEditor from "./components/CanvasEditor";
import AddTemplate from "./pages/addTemplate";
import AddCategory from "./pages/addCategory";
import AddSubcategory from "./pages/addSubcategory";
import TemplateManager from "./pages/TemplateManager"; // 🆕 import
import TemplateGallery from "./pages/TemplateGallery";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 bg-gray-800 text-white flex items-center px-4 gap-4">
        <a href="/" className="font-bold">Framee</a>
        <a href="/templates" className="underline">Templates</a>
      </header>
      <main className="flex-1 bg-gray-100">
        <Routes>
          <Route path="/" element={<CanvasEditor />} />
           <Route path="/editor/:templateId" element={<CanvasEditor />} />
          <Route path="/templates" element={<TemplateGallery />} />
          <Route path="/addTemplate" element={<AddTemplate />} />
          <Route path="/addCategory" element={<AddCategory />} />
          <Route path="/addSubcategory" element={<AddSubcategory />} />
          <Route path="/templateManager" element={<TemplateManager />} /> {/* 🆕 route */}
        </Routes>
      </main>
    </div>
  );
}

export default App;
