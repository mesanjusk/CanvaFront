
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LOCAL_KEY = "localTemplates";

const skeletonCards = Array.from({ length: 8 }, (_, idx) => idx);

const TemplateGallery = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const persistTemplates = useCallback((items) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    } catch (storageError) {
      console.warn("Unable to persist templates locally", storageError);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("https://canvaback.onrender.com/api/template/");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.templates)
          ? res.data.templates
          : res.data.result || [];
      const mapped = data.map((t) => ({ ...t, id: t._id || t.id }));
      setTemplates(mapped);
      persistTemplates(mapped);
    } catch (err) {
      console.error("Error fetching templates", err);
      setError("Unable to reach the template service.");
      try {
        const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
        setTemplates(local);
      } catch (storageError) {
        console.error("Failed to parse cached templates", storageError);
        setTemplates([]);
      }
    } finally {
      setLoading(false);
    }
  }, [persistTemplates]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const hasTemplates = templates.length > 0;
  const emptyMessage = useMemo(() => {
    if (loading) return "";
    if (error && hasTemplates) return "";
    if (error) return "We couldn\'t load templates right now.";
    return "Start by creating your first template.";
  }, [loading, error, hasTemplates]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Choose a Template</h1>

      {error && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm font-medium">{error}</p>
          <button
            type="button"
            className="mt-2 rounded bg-amber-600 px-3 py-1 text-sm font-semibold text-white hover:bg-amber-700"
            onClick={fetchTemplates}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {skeletonCards.map((idx) => (
            <div key={idx} className="animate-pulse rounded bg-white p-2 shadow">
              <div className="mb-3 h-32 w-full rounded bg-gray-200" />
              <div className="mx-auto h-3 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : hasTemplates ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="overflow-hidden rounded bg-white text-left shadow transition hover:-translate-y-0.5 hover:shadow-lg"
              onClick={() => navigate(`/editor/${tpl.id}`)}
            >
              {tpl.image ? (
                <img src={tpl.image} alt={tpl.title || tpl.name} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-slate-100 text-slate-400">
                  No preview
                </div>
              )}
              <div className="p-2 text-center text-sm font-medium text-slate-700">
                {tpl.title || tpl.name || "Untitled"}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
          <p className="font-medium">{emptyMessage}</p>
          <p className="mt-1 text-sm">You can always design from scratch in the editor.</p>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
