
import Banner from "./Banner";
import AllCategory from "../reports/allCategory.jsx";
import Navbar from "../components/Navbar.jsx";
import BottomNavBar from "../components/BottomNavBar.jsx";
import useMediaQuery from "../hooks/useMediaQuery";


export default function CanvaHome() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="font-sans bg-white text-gray-900">
      <Navbar />
      <Banner />
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold">Design Anything</h1>
        <p className="mt-2 text-gray-600">Select a category to start designing like a pro.</p>
      </section>
      <AllCategory />

      <BottomNavBar />
    </div>
  );
}
