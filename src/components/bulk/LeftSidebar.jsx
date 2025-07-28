import React from 'react';
import SidebarSection from './SidebarSection';
import PresetControls from './PresetControls';

const LeftSidebar = ({
  show,
  templates,
  selected,
  setSelected,
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
  handleFile,
  loadStudents,
  currentLayout,
  applyLayout,
}) => {
  return (
    <aside className={`bg-gray-50 w-64 p-4 space-y-4 overflow-y-auto ${show ? 'block' : 'hidden'} md:block`}>
      <SidebarSection title="Template">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Template</label>
          <select
            value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="">Select Template</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      </SidebarSection>

      <SidebarSection title="Page Settings">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Page Size</label>
          <select
            value={size}
            onChange={e => setSize(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Orientation</label>
          <select
            value={orientation}
            onChange={e => setOrientation(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        {size === 'custom' && (
          <>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Page Width</label>
              <input
                type="number"
                value={custom.width}
                onChange={e => setCustom({ ...custom, width: Number(e.target.value) })}
                className="border p-2 rounded"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium">Page Height</label>
              <input
                type="number"
                value={custom.height}
                onChange={e => setCustom({ ...custom, height: Number(e.target.value) })}
                className="border p-2 rounded"
              />
            </div>
          </>
        )}
      </SidebarSection>

      <SidebarSection title="Layout">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Columns</label>
          <input
            type="number"
            min={1}
            value={cols}
            onChange={e => setCols(Number(e.target.value) || 1)}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Rows per Page</label>
          <input
            type="number"
            min={1}
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value) || 1)}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Left Margin</label>
          <input
            type="number"
            value={margins.left}
            onChange={e => setMargins({ ...margins, left: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Right Margin</label>
          <input
            type="number"
            value={margins.right}
            onChange={e => setMargins({ ...margins, right: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Top Margin</label>
          <input
            type="number"
            value={margins.top}
            onChange={e => setMargins({ ...margins, top: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Horizontal Spacing</label>
          <input
            type="number"
            value={spacing.horizontal}
            onChange={e => setSpacing({ ...spacing, horizontal: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Vertical Spacing</label>
          <input
            type="number"
            value={spacing.vertical}
            onChange={e => setSpacing({ ...spacing, vertical: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Card Width</label>
          <input
            type="number"
            value={cardSize.width}
            onChange={e => setCardSize({ ...cardSize, width: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium">Card Height</label>
          <input
            type="number"
            value={cardSize.height}
            onChange={e => setCardSize({ ...cardSize, height: Number(e.target.value) })}
            className="border p-2 rounded"
          />
        </div>
      </SidebarSection>

      <SidebarSection title="Data">
        <div className="flex flex-col">
          <label className="text-sm font-medium">Upload File</label>
          <input type="file" accept=".xlsx,.csv" onChange={handleFile} className="border p-2 rounded" />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium invisible">Load</label>
          <button onClick={loadStudents} className="bg-blue-600 text-white px-3 py-2 rounded">Load Students</button>
        </div>
      </SidebarSection>

      <PresetControls layout={currentLayout} applyLayout={applyLayout} />
    </aside>
  );
};

export default LeftSidebar;
