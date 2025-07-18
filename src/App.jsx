import React from 'react';
import CanvasEditor from './components/CanvasEditor';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <div className="pt-16 pb-10 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <CanvasEditor />
      </main>
      <Footer />
    </div>
  );
}

export default App;
