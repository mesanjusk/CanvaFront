import React from "react";
import CanvasEditor from "./components/CanvasEditor";

function App() {
  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 bg-gray-800 text-white flex items-center px-4">
        Framee
      </header>
      <main className="flex-1 bg-gray-100">
        <CanvasEditor />
      </main>
    </div>
  );
}

export default App;
