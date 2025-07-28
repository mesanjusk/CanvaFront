import React from 'react';
import SidebarSection from './SidebarSection';
import PresetControls from './PresetControls';

const DPI = 300;

const LeftSidebar = ({
  show,
  templates,
  selected,
  setSelected,
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
