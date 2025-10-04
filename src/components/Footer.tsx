
import React from 'react';
import { Instagram, Twitter, Facebook, ArrowUp } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="md:w-1/3">
            <h3 className="text-2xl font-bold mb-4">Amuse Kenya</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Forest adventures and outdoor education for children at Karura Forest. Building character and confidence through nature exploration.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#" 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
            </div>
          </div>
          
          <div className="md:w-1/3">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'About', 'Programs', 'Announcements', 'Gallery', 'Testimonials', 'Contact'].map((item) => (
                <li key={item}>
                  <a 
                    href={`#${item.toLowerCase()}`} 
                    className="text-gray-300 hover:text-white transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:w-1/3">
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <address className="not-italic text-gray-300 leading-relaxed">
              Karura Forest<br />
              Gate F, Thigiri Ridge<br />
              <strong>Training Hours:</strong> Monday to Sunday: 08:00am - 05:00pm<br /><br />
              <a href="tel:0114705763" className="hover:text-white transition-colors duration-300">0114 705 763</a><br />
              <a href="mailto:info@amusekenya.co.ke" className="hover:text-white transition-colors duration-300">info@amusekenya.co.ke</a>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Amuse Kenya. All rights reserved.
          </p>
          <button 
            onClick={scrollToTop}
            className="bg-forest-600 hover:bg-forest-700 text-white p-2 rounded-full transition-colors duration-300 flex items-center gap-2"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
