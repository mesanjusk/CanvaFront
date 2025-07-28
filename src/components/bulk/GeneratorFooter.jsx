import React from 'react';

const DPI = 300;

const GeneratorFooter = ({
  rows,
  index,
  setIndex,
  downloadCurrent,
  downloadAll,
  downloadLayout,
  size,
  setSize,
  orientation,
  setOrientation,
  custom,
  setCustom,
  cols,
  setCols,
  rowsPerPage,
  setRowsPerPage,
  margins,
  setMargins,
  spacing,
  setSpacing,
  cardSize,
  setCardSize,
  onPreview,
}) => (
  <footer className="p-2 bg-gray-200 space-y-2 overflow-y-auto">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="flex flex-col">
        <label className="text-sm font-medium">Page Size</label>
        <select value={size} onChange={e => setSize(e.target.value)} className="border p-1 rounded">
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Orientation</label>
        <select value={orientation} onChange={e => setOrientation(e.target.value)} className="border p-1 rounded">
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
      {size === 'custom' && (
        <>
          <div className="flex flex-col">
            <label className="text-sm font-medium">Width (in)</label>
            <input type="number" value={custom.width / DPI} onChange={e => setCustom({ ...custom, width: Math.round(Number(e.target.value) * DPI) })} className="border p-1 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium">Height (in)</label>
            <input type="number" value={custom.height / DPI} onChange={e => setCustom({ ...custom, height: Math.round(Number(e.target.value) * DPI) })} className="border p-1 rounded" />
          </div>
        </>
      )}
      <div className="flex flex-col">
        <label className="text-sm font-medium">Columns</label>
        <input type="number" min={1} value={cols} onChange={e => setCols(Number(e.target.value) || 1)} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Rows/Page</label>
        <input type="number" min={1} value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value) || 1)} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Left Margin (in)</label>
        <input type="number" value={margins.left / DPI} onChange={e => setMargins({ ...margins, left: Math.round(Number(e.target.value) * DPI) })} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Right Margin (in)</label>
        <input type="number" value={margins.right / DPI} onChange={e => setMargins({ ...margins, right: Math.round(Number(e.target.value) * DPI) })} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Top Margin (in)</label>
        <input type="number" value={margins.top / DPI} onChange={e => setMargins({ ...margins, top: Math.round(Number(e.target.value) * DPI) })} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">H Spacing</label>
        <input type="number" value={spacing.horizontal} onChange={e => setSpacing({ ...spacing, horizontal: Number(e.target.value) })} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">V Spacing</label>
        <input type="number" value={spacing.vertical} onChange={e => setSpacing({ ...spacing, vertical: Number(e.target.value) })} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Card W</label>
        <input type="number" value={cardSize.width} onChange={e => setCardSize({ ...cardSize, width: Number(e.target.value) })} className="border p-1 rounded" />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium">Card H</label>
        <input type="number" value={cardSize.height} onChange={e => setCardSize({ ...cardSize, height: Number(e.target.value) })} className="border p-1 rounded" />
      </div>
      <div className="flex items-end">
        <button onClick={onPreview} className="px-2 py-1 bg-blue-600 text-white rounded w-full">Preview</button>
      </div>
    </div>

    {rows.length > 0 && (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
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
