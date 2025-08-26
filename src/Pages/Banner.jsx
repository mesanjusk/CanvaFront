import React, { useState, useEffect } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Shimmer Loader Component
function ShimmerSlide() {
  return (
    <div className="w-full h-40 md:h-64 bg-gray-200 animate-pulse rounded-lg" />
  );
}

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get(
          "https://idbackend-rf1u.onrender.com/api/banners"
        );
        setBanners(response.data);
      } catch (err) {
        console.error("Error fetching banners:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  return (
    <div className="w-full font-sans bg-white text-gray-900">
      {/* BANNER CAROUSEL */}
      <section className="py-4">
        <div className="w-full">
          {loading ? (
            <div className="w-full px-4">
              <ShimmerSlide />
            </div>
          ) : (
            <Swiper
              spaceBetween={10}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 3000 }}
              pagination={{ clickable: true }}
              modules={[Autoplay, Pagination]}
              className="w-full"
            >
              {banners.map((img, idx) => (
                <SwiperSlide key={idx}>
                  <div className="w-full h-56 md:h-84 bg-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={img.imageUrl}
                      alt={img.altText || `Banner image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/fallback-image.jpg"; // Add fallback image to public folder
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>
    </div>
  );
}
