import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AllCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("https://canvaback.onrender.com/api/category");
        console.log("API response:", response.data);
setCategories(response.data.categories || response.data || []);

      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div >
      <section className="py-4"> 
  <div className="container mx-auto px-4">
    {loading ? (
      <div className="grid grid-cols-3 md:grid-cols-9 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 animate-pulse  p-3"
          >
            <div className="aspect-square bg-gray-300 rounded-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    ) : error ? (
      <div className="text-center text-red-500">{error}</div>
    ) : categories.length === 0 ? (
      <div className="text-center text-gray-500">No categories found.</div>
    ) : (
      <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
        {categories.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/subcategory/${item.category_uuid}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/subcategory/${item.category_uuid}`);
              }
            }}
            role="button"
            tabIndex={0}
            className="cursor-pointer bg-white p-3  transform hover:scale-105 transition duration-300 ease-in-out text-center rounded-lg"
          >
            <div className="aspect-square bg-gray-200 rounded-full mb-2 overflow-hidden relative group mx-auto w-full max-w-[120px]">
              {item.imageUrl?.length ? (
                <img
                  src={item.imageUrl}
                  alt={item.name || "Category"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No Image
                </div>
              )}
            </div>

            <p className="text-sm font-medium truncate transition-colors duration-300 group-hover:text-blue-600">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
</section>

    </div>
  );
}
