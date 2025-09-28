import React, { useEffect, useState, memo } from "react";
import axios from "axios";
import TemplateCard from "./TemplateCard";

const defaultTemplates = [
  {
    _id: "blank",
    name: "Blank",
    isBlank: true,
    canvasWidth: 1080,
    canvasHeight: 1080,
    canvasJson: { version: "5.2.4", objects: [] },
  },
];

const TemplateSidebar = memo(({ loadTemplate }) => {
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
        <TemplateCard key={t._id || t.id || idx} template={t} onSelect={loadTemplate} />
      ))}
    </div>
  );
});

export default TemplateSidebar;
