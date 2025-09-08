import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNavBar from "../components/BottomNavBar.jsx";
import useMediaQuery from "../hooks/useMediaQuery";

export default function Subcategory() {
  const { categoryId } = useParams();
  const id = categoryId;

  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [subcategories, setSubcategories] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [originalTemplates, setOriginalTemplates] = useState([]);

  useEffect(() => {
  const fetchTemplatesByCategoryId = async () => {
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        axios.get("https://canvaback.onrender.com/api/template"),
        axios.get("https://canvaback.onrender.com/api/category")
      ]);

      const templates = templatesRes.data;
      const categories = categoriesRes.data;


      const matchedCategory = categories.find(cat => cat.category_uuid === id);
      if (!matchedCategory) {
        console.warn("No category found with ID:", id);
        setOriginalTemplates([]);
        setAllTemplates([]);
        setSelectedCategoryName('');
        return;
      }

      setSelectedCategoryName(matchedCategory.name);

     
const filtered = templates.filter(
  (temp) => temp.category === matchedCategory.category_uuid || temp.category === matchedCategory._id
);
      setOriginalTemplates(filtered);
      setAllTemplates(filtered);
    } catch (err) {
      console.error("Error fetching templates or categories:", err);
    }
  };

  if (id) {
    fetchTemplatesByCategoryId();
  }
}, [id]);


  // Fetch subcategories based on category ID
useEffect(() => {
  const fetchSubcategories = async () => {
    try {
      const response = await axios.get("https://canvaback.onrender.com/api/subcategory");
      const matched = response.data.filter((sub) => {
        const catId = sub.categoryId?._id || sub.categoryId?.$oid || sub.categoryId;
        return catId?.toString() === id?.toString();
      });
      setSubcategories(matched);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };
  fetchSubcategories();
}, [id]);

const handleClick = async (item) => {
    const subcategoryId = item._id;
    navigate(`/editor/${subcategoryId}`);
  };

  return (
    <>
      
      <div className="font-sans bg-white text-gray-900">
        <div className="flex items-center gap-2 px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-indigo-600 flex items-center hover:underline"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <h2 className="text-lg font-semibold">{selectedCategoryName}</h2>
        </div>
        {/* Subcategory Carousel */}
        <section className="py-4">
          <div className="container mx-auto px-4">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-6 min-w-max">
                {subcategories.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => {
                      const filteredBySub = originalTemplates.filter(
                        (temp) =>
                          temp.subcategory?.trim().toLowerCase() ===
                          item.name?.trim().toLowerCase()
                      );
                      setAllTemplates(filteredBySub);
                    }}
                    className="flex flex-col items-center cursor-pointer focus:outline-none"
                    aria-label={`Filter by ${item.name}`}
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 hover:border-indigo-500 transition">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name || "Subcategory"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium truncate max-w-[96px] text-center">
                      {item.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Template Grid */}
        {allTemplates.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 px-4 pb-6">
            {allTemplates.map((temp) => (
              <div
                key={temp._id}
                className="border rounded-lg p-3 shadow hover:shadow-md hover:scale-105 transform transition cursor-pointer"
                onClick={() => handleClick(temp)}
              >
                <div className="w-full aspect-square overflow-hidden rounded mb-2">
                  <img
                    src={
                      temp.image
                    }
                    alt={temp.title || "Template"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-sm text-center font-medium truncate">{temp.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center px-4">
            No templates found in “{selectedCategoryName || "Selected Category"}”.
          </p>
        )}
      </div>
      
      {isMobile && <BottomNavBar />}
    </>
  );
}
