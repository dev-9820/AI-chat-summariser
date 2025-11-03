import { IoLogoWhatsapp, IoCall, IoLocationOutline, IoMailOutline } from "react-icons/io5";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#012563] to-[#144BAF] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative mx-40 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold text-white mb-6">
              DENTAL<span className="text-blue-200">CLINIC</span>
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Experience world-class dental care in a warm and welcoming environment. 
              Your smile is our priority.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              {[FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn].map((Icon, index) => (
                <div
                  key={index}
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 cursor-pointer"
                >
                  <Icon className="text-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {['Home', 'Services', 'About Us', 'Our Team', 'Prices', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold text-lg mb-6">Our Services</h4>
            <ul className="space-y-3">
              {[
                'Therapeutic Dentistry',
                'Teeth Cleaning',
                'Dental Implants',
                'Orthodontics',
                'Aesthetic Restoration',
                'Teeth Whitening'
              ].map((service) => (
                <li key={service}>
                  <a href="#" className="text-blue-100 hover:text-white transition-colors duration-300 text-sm">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold text-lg mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
                  <IoLocationOutline className="text-white text-lg" />
                </div>
                <span className="text-blue-100 text-sm">STREET 44, BANDRA</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
                  <IoCall className="text-white text-lg" />
                </div>
                <span className="text-blue-100 text-sm">+99 9999 99999</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
                  <IoMailOutline className="text-white text-lg" />
                </div>
                <span className="text-blue-100 text-sm">hello@dentalclinic.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-white font-semibold text-lg mb-2">Stay Updated</h4>
              <p className="text-blue-100 text-sm">Subscribe to our newsletter for health tips and special offers.</p>
            </div>
            <div className="flex space-x-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 w-64"
              />
              <button className="px-6 py-3 bg-white text-[#012563] font-semibold rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex justify-between items-center">
            <p className="text-blue-100 text-sm">
              © 2025 Dev Bhanushali. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-blue-100 hover:text-white transition-colors duration-300 text-sm"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute bottom-10 left-20 w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
      <div className="absolute top-10 right-32 w-6 h-6 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
    </footer>
  );
};

export default Footer;