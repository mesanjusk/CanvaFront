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

  return (
    <div className="flex gap-2 items-center">
      <select
        value={selected}
        onChange={(e) => loadPreset(e.target.value)}
        className="border rounded p-1 flex-1"
      >
        <option value="">Presets</option>
        {Object.keys(presets).map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <button onClick={savePreset} className="px-2 py-1 bg-blue-600 text-white rounded">Save</button>
    </div>
  );
};

export default PresetControls;
