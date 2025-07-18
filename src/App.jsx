import React from 'react';
import CanvasEditor from './components/CanvasEditor';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      {/* Padding matches Header (h-14) and Footer (h-10) */}
      <main className="flex-1 pt-14 pb-10 px-2 py-2 md:px-4 md:py-6 w-full max-w-full overflow-auto">
        <CanvasEditor />
      </main>
      <Footer />
    </div>
  );
}

export default App;
