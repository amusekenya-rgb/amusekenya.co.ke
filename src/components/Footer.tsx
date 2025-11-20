import React, { useState, useEffect } from 'react';
import { Instagram, Twitter, Facebook, ArrowUp, MessageCircle } from 'lucide-react';
import { cmsService } from '@/services/cmsService';

const Footer = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await cmsService.getSiteSettings();
    setSettings(data?.metadata);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Default values
  const footerDesc = settings?.footer_description || 'Forest adventures and outdoor education for children at Karura Forest. Building character and confidence through nature exploration.';
  const phone = settings?.contact_phone || '0114 705 763';
  const email = settings?.contact_email || 'info@amusekenya.co.ke';
  const address = settings?.contact_address || 'Karura Forest\nGate F, Thigiri Ridge';
  const hours = settings?.contact_hours || 'Monday to Sunday: 08:00am - 05:00pm';
  const instagram = settings?.social_instagram || '#';
  const twitter = settings?.social_twitter || '#';
  const facebook = settings?.social_facebook || '#';
  const copyright = settings?.copyright_text || 'Amuse Kenya. All rights reserved.';
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="md:w-1/3">
            <h3 className="text-2xl font-bold mb-4">Amuse Kenya</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {footerDesc}
            </p>
            <div className="flex space-x-4">
              <a 
                href={instagram} 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
              <a 
                href={twitter} 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter size={20} />
              </a>
              <a 
                href={facebook} 
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />
              </a>
              <a 
                href={`https://api.whatsapp.com/send/?phone=${phone.replace(/\s/g, '').replace(/^\+/, '')}&text=Hello! I need assistance from Amuse Kenya&type=phone_number`}
                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-300"
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} />
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
              {address.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}<br />
                </React.Fragment>
              ))}
              <strong>Training Hours:</strong> {hours}<br /><br />
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors duration-300">{phone}</a><br />
              <a href={`mailto:${email}`} className="hover:text-white transition-colors duration-300">{email}</a>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Amuse Kenya. All rights reserved.
            </p>
            <a 
              href="/test/email-monitor" 
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Email Test Monitor
            </a>
          </div>
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
