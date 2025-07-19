import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import CanvasEditor from "./components/CanvasEditor";
import AddTemplate from "./pages/addTemplate";
import AddCategory from "./pages/addCategory";
import AddSubcategory from "./pages/addSubcategory";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 bg-gray-800 text-white flex items-center px-4">
        Framee
      </header>
      <main className="flex-1 bg-gray-100">
       
       <Routes>
            <Route path="/" element={<CanvasEditor />} />
            <Route path="/addTemplate" element={<AddTemplate />} />
            <Route path="/addCategory" element={<AddCategory />} />
            <Route path="/addSubcategory" element={<AddSubcategory />} />
        
          </Routes>
      </main>
    </div>
  );
}

export default App;
