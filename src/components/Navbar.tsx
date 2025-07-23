
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 px-4 md:px-8",
        isScrolled 
          ? "py-2 glass-card bg-white/90 shadow-sm" 
          : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className={cn(
              "text-xl md:text-2xl font-bold transition-colors duration-300",
              isScrolled ? "text-forest-800" : "text-white"
            )}>
              Amuse.Ke
            </span>
          </a>

          <ul className="hidden md:flex items-center space-x-8">
            {['Home', 'Announcements', 'About', 'Programs', 'Gallery', 'Testimonials', 'Contact'].map((item) => (
              <li key={item}>
                <a 
                  href={`#${item.toLowerCase()}`} 
                  className={cn(
                    "font-medium hover-lift",
                    isScrolled 
                      ? "text-gray-700 hover:text-forest-600" 
                      : "text-white hover:text-forest-100"
                  )}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center">
            <button 
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className={isScrolled ? "text-gray-800" : "text-white"} size={24} />
              ) : (
                <Menu className={isScrolled ? "text-gray-800" : "text-white"} size={24} />
              )}
            </button>
          </div>
        </div>

        <div className={cn(
          "md:hidden absolute left-0 right-0 top-full px-4 py-2 transition-all duration-300 ease-in-out transform origin-top",
          mobileMenuOpen 
            ? "opacity-100 scale-y-100" 
            : "opacity-0 scale-y-0 pointer-events-none",
          "glass-card mt-2 rounded-lg"
        )}>
          <ul className="py-2 space-y-3">
            {['Home', 'Announcements', 'About', 'Programs', 'Gallery', 'Testimonials', 'Contact'].map((item) => (
              <li key={item}>
                <a 
                  href={`#${item.toLowerCase()}`} 
                  className="block py-2 px-4 font-medium text-gray-800 hover:text-forest-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
