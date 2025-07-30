import React, { useEffect, useState } from "react";
import axios from "axios";

const defaultTemplates = [
  {
    name: "Blank",
    data: { version: "5.2.4", objects: [] },
    image: null,
  },
];

const TemplateCard = ({ template, onSelect }) => (
  <div
    className="cursor-pointer rounded overflow-hidden shadow hover:shadow-lg bg-white dark:bg-gray-700"
    onClick={() =>
      onSelect(
        template.layout ? JSON.parse(template.layout) : template.data
      )
    }
  >
    {template.image && (
      <img
        src={template.image}
        alt={template.title || template.name}
        className="w-full h-24 object-cover"
      />
    )}
    <div className="p-2 text-center text-sm">
      {template.title || template.name}
    </div>
  </div>
);

const TemplatePanel = ({ loadTemplate }) => {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/templatelayout")
      .then((res) => setSaved(res.data))
      .catch((err) => console.error("Failed to load templates", err));
  }, []);

  const templates = defaultTemplates.concat(saved);

  return (
    <div className="grid grid-cols-2 gap-2 w-48 sm:w-56">
      {templates.map((t, idx) => (
        <TemplateCard key={idx} template={t} onSelect={loadTemplate} />
      ))}
    </div>
  );
};

export default TemplatePanel;
