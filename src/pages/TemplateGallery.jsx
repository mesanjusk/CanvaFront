
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LOCAL_KEY = "localTemplates";


const TemplateGallery = () => {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axios.get("https://canvaback.onrender.com/api/template/");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.templates)
          ? res.data.templates
          : res.data.result || [];
        const mapped = data.map((t) => ({ ...t, id: t._id }));
        setTemplates(mapped);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
      } catch (err) {
        console.error("Error fetching templates", err);
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        setTemplates(local);
        console.error("Error fetching templates", err);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Choose a Template</h1>
      {templates.length === 0 ? (
        <p>No templates found.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div
               key={tpl.id}
              className="bg-white shadow rounded overflow-hidden cursor-pointer hover:shadow-md"
               onClick={() => navigate(`/editor/${tpl.id}`)}
            >
              {tpl.image && (
                <img src={tpl.image} alt={tpl.title} className="h-32 w-full object-cover" />
              )}
              <div className="p-2 text-center font-medium">{tpl.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
