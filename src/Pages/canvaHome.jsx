import Footer from "../components/Footer.jsx";
import Banner from "./Banner";
import AllCategory from "../reports/allCategory.jsx";
import Navbar from "../components/Navbar.jsx";

export default function CanvaHome() {
  return (
    <div className="font-sans bg-white text-gray-900">
      <Navbar />
      <Banner />
      <AllCategory />   
      <Footer />
    </div>
  );
}
