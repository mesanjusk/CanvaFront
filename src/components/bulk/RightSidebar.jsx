import React from 'react';

const RightSidebar = ({
  show,
  templates,
  selectedTemplate,
  previewUrl,
  onSelect,
  onBack,
}) => {
  if (!selectedTemplate) {
    return (
      <aside
        className={`bg-gray-50 w-64 p-4 overflow-y-auto space-y-2 ${show ? 'block' : 'hidden'} md:block`}
      >
        <h2 className="font-medium">Templates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="p-2 bg-white rounded shadow text-center hover:bg-gray-100"
            >
              <img
                src={tpl.image}
                alt={tpl.title}
                className="w-full h-20 object-cover mb-1 border rounded"
              />
              <p className="text-xs font-medium truncate">{tpl.title}</p>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`bg-gray-50 w-64 p-4 overflow-y-auto space-y-2 ${show ? 'block' : 'hidden'} md:block`}
    >
      <h2 className="font-medium mb-2">Preview</h2>
      {previewUrl && (
        <img src={previewUrl} alt="Preview" className="w-full mb-2 border rounded" />
      )}
      <button onClick={onBack} className="w-full bg-gray-200 rounded p-2">
        Change Template
      </button>
    </aside>
  );
};

export default RightSidebar;
