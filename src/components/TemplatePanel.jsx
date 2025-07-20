import React from "react";

const templates = [
  {
    name: "Blank",
    data: { version: "5.2.4", objects: [] },
  },
  {
    name: "Greeting",
    data: {
      version: "5.2.4",
      objects: [
        { type: "i-text", left: 80, top: 80, text: "Hello", fontSize: 40 },
        { type: "rect", left: 200, top: 150, width: 120, height: 80, fill: "#f0f0f0" },
      ],
    },
  },
];

const TemplatePanel = ({ loadTemplate }) => (
  <div className="flex gap-2">
    {templates.map((t) => (
      <button
        key={t.name}
        onClick={() => loadTemplate(t.data)}
        className="p-2 bg-white shadow rounded hover:bg-blue-100"
      >
        {t.name}
      </button>
    ))}
  </div>
);

export default TemplatePanel;
