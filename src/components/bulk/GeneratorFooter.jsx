import React from 'react';

const GeneratorFooter = ({
  rows,
  index,
  setIndex,
  downloadCurrent,
  downloadAll,
  downloadLayout,
}) => (
  <footer className="p-2 bg-gray-200">
    {rows.length > 0 && (
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={() => setIndex(i => Math.max(i - 1, 0))} className="px-2 py-1 bg-gray-200 rounded">Prev</button>
        <span>{index + 1} / {rows.length}</span>
        <button onClick={() => setIndex(i => Math.min(i + 1, rows.length - 1))} className="px-2 py-1 bg-gray-200 rounded">Next</button>
        <button onClick={downloadCurrent} className="px-2 py-1 bg-green-600 text-white rounded">Download</button>
        <button onClick={downloadAll} className="px-2 py-1 bg-blue-600 text-white rounded">Export All</button>
        <button onClick={() => downloadLayout('pdf')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout PDF</button>
        <button onClick={() => downloadLayout('png')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout PNG</button>
        <button onClick={() => downloadLayout('jpg')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout JPG</button>
      </div>
    )}
  </footer>
);

export default GeneratorFooter;
