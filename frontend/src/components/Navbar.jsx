import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setIsScrolled(scrollTop > 760);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`sticky top-0 z-50  transition-all duration-500 ${
      isScrolled 
        ? "top-5 mx-40 bg-[#144BAF]/50 rounded-3xl" 
        : "top-5 mx-40 rounded-3xl"
    }`}>
      <div className={`flex justify-between items-center p-5 backdrop-blur-lg  transition-all duration-500 ${
        isScrolled 
          ? "rounded-3xl shadow-md bg-white/20" 
          : "rounded-3xl shadow-md bg-white/20"
      }`}>
        <h1 
          className="text-2xl font-bold text-white cursor-pointer transition-all duration-300"
          onClick={() => navigate("/")}
        >
          DENTAL<span className="text-blue-200">CLINIC</span>
        </h1>
        
        <div className="flex items-center space-x-6">
  {[
    { name: "Home", id: "home" },
    { name: "Services", id: "services" },
    { name: "Advantages", id: "services" },
    { name: "About", id: "about" },
    { name: "Team", id: "team" },
    { name: "Faq", id: "team" },
  ].map((link) => (
    <button
      key={link.id}
      onClick={() => {
        const section = document.getElementById(link.id);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }}
      className="text-white uppercase hover:text-blue-200 transition-colors duration-300"
    >
      {link.name}
    </button>
  ))}
</div>

        <button
          onClick={logout}
          className="px-6 uppercase py-2 bg-white text-[#012563] rounded-full hover:scale-105 transition-all duration-300 shadow-md hover:shadow-blue-500/25 font-semibold"
        >
          Make an Appointment
        </button>
      </div>
    </div>
  );
}