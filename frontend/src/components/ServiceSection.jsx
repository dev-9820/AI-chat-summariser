import { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { MdOutlineArrowRight } from "react-icons/md";

const ServicesSection = () => {
  const [activeIndex, setActiveIndex] = useState();

  const services = [
    {
      id: 1,
      title: "Therapeutic Dentistry",
      number: "01",
      description: "Our therapeutic delivery services have an appropriate form of chef and beer for growing processes and healthy medicine techniques, playing one part of our culture. Our important bathroom doorwork, designed, and presented methods to ensure your comfort and safety at every site.",
      features: [
        "Treatment of cardiovascular anomalies with arthritis, muscle, illness.",
        "Therapy for inflammatory conditions, including health and procedures.",
        "Impairment over a life in professions covering professional employment."
      ],
      note: "Your prior distribution is not either professional.",
      image: "https://images.pexels.com/photos/3779703/pexels-photo-3779703.jpeg"
    },
    {
      id: 2,
      title: "Professional Teeth Cleaning",
      number: "02",
      subtitle: "TOTAL NAME",
      description: "Comprehensive dental cleaning procedures to remove plaque, tartar, and stains for optimal oral hygiene and fresh breath.",
      features: [
        "Advanced ultrasonic scaling technology",
        "Plaque and tartar removal",
        "Teeth polishing and fluoride treatment",
        "Personalized oral hygiene instructions"
      ],
      image: "https://images.pexels.com/photos/6627566/pexels-photo-6627566.jpeg"
    },
    {
      id: 3,
      title: "Dental Implantation",
      number: "03",
      subtitle: "Term of 2008",
      description: "Permanent tooth replacement solutions using state-of-the-art implant technology for natural-looking and functional results.",
      features: [
        "Titanium implant placement",
        "Bone grafting when necessary",
        "Custom crown fabrication",
        "Lifetime warranty on implants"
      ],
      image: "https://images.pexels.com/photos/6502306/pexels-photo-6502306.jpeg"
    },
    {
      id: 4,
      title: "Orthodontics (Braces)",
      number: "04",
      subtitle: "Term applicable",
      description: "Comprehensive orthodontic treatments including traditional braces and clear aligners for perfect teeth alignment.",
      features: [
        "Traditional metal braces",
        "Ceramic clear braces",
        "Invisalign clear aligners",
        "Retention phase management"
      ],
      image: "https://images.pexels.com/photos/6502309/pexels-photo-6502309.jpeg"
    },
    {
      id: 5,
      title: "Aesthetic Tooth Restoration",
      number: "05",
      subtitle: "Term of 2008",
      description: "Cosmetic dental procedures to enhance your smile including veneers, bonding, and crown restorations.",
      features: [
        "Porcelain veneers",
        "Composite bonding",
        "Dental crowns and bridges",
        "Smile design consultation"
      ],
      image: "https://images.pexels.com/photos/18662954/pexels-photo-18662954.jpeg"
    },
    {
      id: 6,
      title: "Teeth Whitening",
      number: "06",
      subtitle: "Term by 2008",
      description: "Professional teeth whitening treatments for a brighter, more confident smile using safe and effective techniques.",
      features: [
        "In-office laser whitening",
        "Take-home whitening kits",
        "Custom tray fabrication",
        "Stain removal and protection"
      ],
      image: "https://images.pexels.com/photos/6812501/pexels-photo-6812501.jpeg"
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <div className="bg-white py-20">
      <div className="mx-40">
        {/* Header Section */}
        <div className="flex flex-row mt-20 mb-6">
          <h2 className="w-1/2 text-5xl font-extrabold text-[#144BAF] mb-6">PRICES AND SERVICES</h2>
          
          

          {/* Description */}
          <div className="w-1/2">
            <p className="text-md text-[#144BAF] leading-relaxed">
              The site is a range of entertainment, theater, production, magazine, conferences, and logistics 
              organizations on the internet with content. The environment and our structure include for every cabinet.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="">
          {/* Left Column - Accordion */}
          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-500 ${
                  activeIndex === index 
                    ? 'border-blue-400 shadow-2xl shadow-blue-100 bg-gradient-to-br from-[#012563] to-[#144BAF]' 
                    : 'border-gray-200 hover:border-gray-300 bg-[#144BAF]/5'
                }`}
              >
                <button
                  className="w-full p-6 text-left flex justify-between items-center"
                  onClick={() => toggleAccordion(index)}
                >
                  <div className="flex grid-col-2 items-center gap-4">
                    <div>
                      <span className={`text-2xl font-bold ${
                        activeIndex === index ? 'text-white' : 'text-[#144BAF]'
                      }`}>
                        {service.number}
                      </span>
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold ${
                        activeIndex === index ? 'text-white' : 'text-[#144BAF]'
                      }`}>
                        {service.title}
                      </h3>
                    </div>
                  </div>
                  {activeIndex === index ? (
                    <FiChevronUp className="text-blue-600 text-xl" />
                  ) : (
                    <FiChevronDown className="text-gray-400 text-xl" />
                  )}
                </button>

                <div
  className={`transition-all duration-700 ease-in-out overflow-hidden ${
    activeIndex === index ? 'max-h-[1000px] opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
  }`}
>
  <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

    {/* Left Column - Text */}
    <div>
      <p className="text-white mb-4 leading-relaxed">{service.description}</p>

      {service.features && (
        <ul className="space-y-2 mb-4">
          {service.features.map((feature, idx) => (
            <li key={idx} className="items-center gap-2 text-white">
              <span className="text-blue-400 mr-2 mt-1">•</span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {service.note && (
        <p className="text-sm text-white italic">{service.note}</p>
      )}

      {/* Book Appointment Card */}
      <div className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 w-64 rounded-xl p-3 mt-8 cursor-pointer group">
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-tight group-hover:text-blue-100 transition-colors duration-300">
              Book Appointment
            </p>
          </div>
          <div className="flex-shrink-0 group-hover:translate-x-1 transition-transform duration-300">
            <MdOutlineArrowRight className="bg-white rounded-full text-2xl p-1 text-[#012563] group-hover:bg-blue-100 transition-colors duration-300" />
          </div>
        </div>
      </div>
    </div>

    {/* Right Column - Image */}
    <div className="flex justify-center">
      <div className="rounded-2xl overflow-hidden w-full max-w-md aspect-video bg-gray-100">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
    </div>
  </div>
</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;