const TeamSection = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Alexey Vinogradov",
      role: "Deceit Process & personal experience",
      image: "https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Dental Surgeon & Implant Specialist",
      image: "https://images.pexels.com/photos/27935427/pexels-photo-27935427.jpeg"
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Orthodontics & Braces Expert",
      image: "https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg"
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      role: "Aesthetic Dentistry & Whitening",
      image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg"
    }
  ];

  return (
    <div id="team" className="bg-white h-screen pt-40">
      <div className="mx-40">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-[#144BAF] mb-8">OUR TEAM</h2>
          
          <p className="text-lg text-[#144BAF] leading-relaxed max-w-2xl mx-auto">
            Our domain environment is designed to improve<br />
            experience of mental health, the workplace of the<br />
            Health system and other human resources needs offered.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-4 gap-8">
          {teamMembers.map((member) => (
            <div key={member.id} className="text-center group cursor-pointer">
              {/* Image Container with Blue Tint and Hover Effect */}
              <div className="relative overflow-hidden rounded-2xl mb-6 shadow-lg">
                <div className="w-full  h-80 bg-gradient-to-br from-[#012563] to-[#144BAF] rounded-2xl overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500 ease-out"
                  />
                </div>
                
                {/* Blue Overlay - disappears on hover */}
                <div className="absolute inset-0 bg-[#144BAF]/40 group-hover:bg-transparent transition-all duration-500 rounded-2xl"></div>
                
                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#144BAF] group-hover:scale-[1.02] transition-all duration-300 rounded-2xl"></div>
              </div>

              {/* Member Info */}
              <div className="group-hover:opacity-100 opacity-0 bg-white/50 backdrop-blur-md rounded-2xl px-4 py-1 mx-3 -translate-y-24 z-50 mx-auto">
              <h3 className="text-xl font-bold text-[#144BAF]  transition-colors duration-300">
                {member.name}
              </h3>
              <p className="text-sm text-gray-800  transition-colors duration-300">
                {member.name === "Alexey Vinogradov" ? "Deceit Process & personal experience" : member.role}
              </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSection;