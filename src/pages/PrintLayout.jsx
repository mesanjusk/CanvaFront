import React, { useState } from 'react';
import CanvasEditor from '../components/CanvasEditor';
import ErrorBoundary from '../components/ErrorBoundary';

const templates = [
  { id: 1, title: 'A4 Portrait', width: 2480, height: 3508 },
  { id: 2, title: 'A4 Landscape', width: 3508, height: 2480 },
];

const PrintLayout = () => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Print Layouts</h1>
      <div className="flex space-x-4">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`px-2 py-1 border rounded ${selected === t.id ? 'bg-blue-600 text-white' : ''}`}
          >
            {t.title}
          </button>
        ))}
      </div>
      {selected && (
        <div className="border p-2">
          <ErrorBoundary>
            <CanvasEditor templateId={selected} hideHeader />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default PrintLayout;
