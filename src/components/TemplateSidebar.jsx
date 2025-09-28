import React, { useEffect, useState, memo } from "react";
import axios from "axios";
import TemplateCard from "./TemplateCard";
import { normalizeTemplateMeta } from "../utils/templateUtils";

const defaultTemplates = [
  normalizeTemplateMeta({
    _id: "blank",
    name: "Blank",
    isBlank: true,
    width: 1080,
    height: 1080,
    canvasJson: { version: "5.2.4", objects: [] },
  }),
];

const TemplateSidebar = memo(({ loadTemplate, onSelect }) => {
  const handleSelect = onSelect ?? loadTemplate;
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/templatelayout")
      .then((res) => {
        const payload = res.data?.result || res.data?.data || res.data;
        const list = Array.isArray(payload) ? payload : [];
        setSaved(list.map((item) => normalizeTemplateMeta(item)));
      })
      .catch((err) => {
        console.error("Failed to load templates", err);
        setSaved([]);
      });
  }, []);

  const templates = defaultTemplates.concat(saved);

  return (
    <div className="grid grid-cols-2 gap-2 w-48 sm:w-56">
      {templates.map((t, idx) => (
        <TemplateCard key={t._id || t.id || idx} template={t} onSelect={handleSelect} />
      ))}
    </div>
  );
});

export default TemplateSidebar;
