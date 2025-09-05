import React, { useEffect, useState } from "react";
import axios from "axios";
import TemplateCard from "./TemplateCard";

const defaultTemplates = [
  {
    name: "Blank",
    data: { version: "5.2.4", objects: [] },
    image: null,
  },
];

const TemplateSidebar = ({ loadTemplate }) => {
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

export default TemplateSidebar;
