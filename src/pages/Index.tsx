import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Announcements from '@/components/Announcements';
import AboutSection from '@/components/AboutSection';
import ProgramHighlights from '@/components/ProgramHighlights';
import YearlyCalendar from '@/components/YearlyCalendar';
import TeamSection from '@/components/TeamSection';
import Gallery from '@/components/Gallery';
import Testimonials from '@/components/Testimonials';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';
import { loadFromLocalStorage } from '@/services/dataService';
import { loadEvents } from '@/services/calendarService';
import { Button } from '@/components/ui/button';
import { LockKeyhole } from 'lucide-react';

const Index = () => {
  const [secretClicks, setSecretClicks] = useState(0);
  const [secretVisible, setSecretVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const data = loadFromLocalStorage();
    console.log('Data loaded on Index page:', data);
    
    const events = loadEvents();
    console.log('Calendar events loaded:', events.length);
    
    const lazyImages = document.querySelectorAll('.lazy-image');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.complete) {
              img.classList.add('loaded');
            } else {
              img.onload = () => {
                img.classList.add('loaded');
              };
              
              img.onerror = () => {
                console.warn('Failed to load image:', img.src);
                img.classList.add('error-loading');
              };
            }
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '100px 0px',
        threshold: 0.01
      });
      
      lazyImages.forEach((img) => {
        imageObserver.observe(img);
      });
      
      return () => {
        lazyImages.forEach((img) => {
          imageObserver.unobserve(img);
        });
      };
    } else {
      const lazyLoadImages = () => {
        const lazyImagesArray = Array.from(lazyImages);
        lazyImagesArray.forEach((img) => {
          if (!(img instanceof HTMLImageElement)) return;
          
          if (img.getBoundingClientRect().top <= window.innerHeight && 
              img.getBoundingClientRect().bottom >= 0 &&
              getComputedStyle(img).display !== 'none') {
            
            if (img.complete) {
              img.classList.add('loaded');
            } else {
              img.onload = () => img.classList.add('loaded');
            }
          }
        });
      };
      
      lazyLoadImages();
      
      if (typeof window !== 'undefined') {
        const win = window as Window;
        win.addEventListener('scroll', lazyLoadImages);
        win.addEventListener('resize', lazyLoadImages);
        
        return () => {
          win.removeEventListener('scroll', lazyLoadImages);
          win.removeEventListener('resize', lazyLoadImages);
        };
      }
      
      return () => {};
    }
  }, []);

  const handleSecretClick = () => {
    setSecretClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setSecretVisible(true);
        toast({
          title: "Secret Access Unlocked!",
          description: "You've found the admin portal access.",
          duration: 3000,
        });
      }
      return newCount;
    });
  };

  const handleAdminAccess = () => {
    navigate('/admin');
  };
  
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Announcements />
      <AboutSection />
      <div className="bg-forest-50">
        <ProgramHighlights />
        <YearlyCalendar />
      </div>
      <TeamSection />
      <Gallery />
      <Testimonials />
      <ContactForm />
      <Footer />

      <div 
        className="fixed bottom-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full cursor-pointer opacity-20 hover:opacity-100 transition-opacity"
        onClick={handleSecretClick}
      >
        <LockKeyhole size={20} className="text-gray-500" />
      </div>

      {secretVisible && (
        <div className="fixed bottom-24 right-6 z-10">
          <Button 
            variant="outline" 
            className="bg-white text-forest-700 border-forest-500 shadow-lg"
            onClick={handleAdminAccess}
          >
            Admin Access
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
