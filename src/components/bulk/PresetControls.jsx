import React, { useState } from 'react';

const STORAGE_KEY = 'bulkLayoutPresets';

const PresetControls = ({ layout, applyLayout }) => {
  const [presets, setPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [selected, setSelected] = useState('');

  const savePreset = () => {
    const name = prompt('Preset name');
    if (!name) return;
    const newPresets = { ...presets, [name]: layout };
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    setSelected(name);
  };

  const loadPreset = (name) => {
    setSelected(name);
    if (presets[name]) applyLayout(presets[name]);
  };

  const Thumbnail = ({ layout }) => {
    const cols = layout.cols || 1;
    const rows = layout.rowsPerPage || 1;
    return (
      <div
        className="w-12 h-12 grid gap-px bg-gray-200"
        style={{ gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div key={i} className="bg-white border" />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <button onClick={savePreset} className="px-2 py-1 bg-blue-600 text-white rounded w-full">Save Layout</button>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(presets).map(([name, val]) => (
          <button
            key={name}
            onClick={() => loadPreset(name)}
            className={`border rounded p-1 flex flex-col items-center ${selected === name ? 'ring-2 ring-blue-500' : ''}`}
          >
            <Thumbnail layout={val} />
            <span className="text-xs mt-1 truncate w-full text-center">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetControls;
