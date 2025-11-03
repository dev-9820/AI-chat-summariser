import { MdOutlineArrowRight } from "react-icons/md";

const AboutClinic = () => {
  return (
    <div className="bg-white h-screen from-[#012563] to-[#144BAF] py-20">
      <div className="mx-40 mt-40">
        <h2 className="text-5xl text-[#144BAF] font-extrabold mb-8">ABOUT OUR CLINIC</h2>
        <div className="grid bg-[#144BAF] rounded-2xl grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-white">
            
            
            
            <p className="text-lg p-10 leading-relaxed mb-8">
              We are a team of professional dentists who have been working for you for over 10 years. 
              In our clinic, you'll find cutting-edge technologies, high-quality service, and care 
              for your comfort. We strive to make your visit to the dentist as pleasant as possible.
            </p>


            {/* Book Appointment Card */}
      <div className="bg-white/20 m-10 -mt-10 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 w-64 rounded-xl p-3 mt-8 cursor-pointer group">
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
          <div className="flex justify-end -m-0">
            <div className="w-full  h-96  rounded-2xl   backdrop-blur-sm">
              <img src="https://images.pexels.com/photos/4269696/pexels-photo-4269696.jpeg" alt="Our Dental Clinic" className="w-full h-full object-cover rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutClinic;