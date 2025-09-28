import React, { useEffect, useMemo, useState, memo } from "react";
import axios from "axios";
import TemplateCard from "./TemplateCard";

const defaultTemplates = [
  {
    name: "Blank",
    data: { version: "5.2.4", objects: [] },
    image: null,
  },
];

const TemplateSidebar = memo(({ loadTemplate }) => {
  const [saved, setSaved] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    axios
      .get("https://canvaback.onrender.com/api/templatelayout")
      .then((res) => setSaved(res.data))
      .catch((err) => console.error("Failed to load templates", err));
  }, []);

  const templates = useMemo(() => {
    const list = defaultTemplates.concat(saved);
    if (!query.trim()) return list;
    const term = query.trim().toLowerCase();
    return list.filter((item) => {
      const label = (item.title || item.name || "").toLowerCase();
      return label.includes(term);
    });
  }, [saved, query]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates"
          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>
      {templates.length === 0 ? (
        <p className="px-2 text-xs text-slate-500">No templates match your search.</p>
      ) : (
        <div className="grid w-48 grid-cols-2 gap-2 sm:w-56">
          {templates.map((t, idx) => (
            <TemplateCard key={idx} template={t} onSelect={loadTemplate} />
          ))}
        </div>
      )}
    </div>
  );
});

export default TemplateSidebar;
