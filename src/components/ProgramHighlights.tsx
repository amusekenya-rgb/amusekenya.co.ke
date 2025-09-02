import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { TreePine, TentTree, Bird } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

interface Program {
  id: string;
  title: string;
  description: string;
  ageRange: string;
  iconType: 'TreePine' | 'TentTree' | 'Bird';
  colorAccent: string;
  startDate: string;
  duration: string;
}

const programs: Program[] = [
  {
    id: '1',
    title: "Daily Activities",
    ageRange: "Ages 3-17",
    description: "Join us at Karura Forest for a full range of forest activities. Monday to Sunday from 8:00 AM to 5:00 PM for exciting nature exploration and outdoor fun.",
    iconType: "TreePine",
    colorAccent: "accent-forest",
    startDate: "Every Day",
    duration: "8 AM - 5 PM"
  },
  {
    id: '2',
    title: "Adventure Camps",
    ageRange: "Ages 5-17",
    description: "Spark your child's love for adventure! Our exciting camps offer games, orientation, survival skills and exploration in nature. Unforgettable memories await!",
    iconType: "TentTree",
    colorAccent: "accent-earth",
    startDate: "Holiday Periods",
    duration: "Multi-day"
  },
  {
    id: '3',
    title: "Birthday Parties",
    ageRange: "All Ages",
    description: "Make birthdays magical! Our exciting service brings the fun to you. We provide engaging activities, unforgettable themes, and memories that last.",
    iconType: "Bird",
    colorAccent: "accent-sky",
    startDate: "By Appointment",
    duration: "2-4 Hours"
  }
];

const ProgramCard: React.FC<{ program: Program; index: number }> = ({ program, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, threshold: 0.2 });
  
  const renderIcon = () => {
    const iconProps = { className: "w-10 h-10 mb-2" };
    
    switch(program.iconType) {
      case 'TreePine':
        return <TreePine {...iconProps} />;
      case 'TentTree':
        return <TentTree {...iconProps} />;
      case 'Bird':
        return <Bird {...iconProps} />;
      default:
        return <TreePine {...iconProps} />;
    }
  };
  
  const getAccentColorClass = () => {
    switch(program.colorAccent) {
      case 'accent-forest':
        return 'bg-green-100 border-green-200 hover:bg-green-50';
      case 'accent-earth':
        return 'bg-amber-100 border-amber-200 hover:bg-amber-50';
      case 'accent-sky':
        return 'bg-blue-100 border-blue-200 hover:bg-blue-50';
      default:
        return 'bg-green-100 border-green-200 hover:bg-green-50';
    }
  };
  
  const delay = index * 0.2;
  
  const handleCardClick = () => {
    const contactSection = document.getElementById('contact');
    contactSection?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div
      ref={ref}
      className="flex-1 min-w-[280px] max-w-md transition-opacity duration-1000 opacity-0"
      style={{ 
        transitionDelay: `${delay}s`,
        opacity: isInView ? 1 : 0
      }}
    >
      <div onClick={handleCardClick} className="block h-full cursor-pointer">
        <Card className={`h-full border-2 transition ${getAccentColorClass()}`}>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="mb-4">
              {renderIcon()}
              <h3 className="text-xl font-semibold mb-1">{program.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{program.ageRange}</p>
            </div>
            <p className="text-gray-700 mb-4 flex-grow">{program.description}</p>
            <div className="text-sm text-gray-600 mt-auto">
              <div><span className="font-medium">Starts:</span> {program.startDate}</div>
              <div><span className="font-medium">Duration:</span> {program.duration}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProgramHighlights: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target instanceof HTMLElement) {
              entry.target.style.transform = 'translateY(0)';
              entry.target.style.opacity = '1';
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  const handleRegisterClick = () => {
    const contactSection = document.getElementById('contact');
    contactSection?.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <section className="py-24 px-4" id="programs">
      <div 
        ref={sectionRef}
        className="max-w-6xl mx-auto transition-all duration-1000 transform translate-y-10 opacity-0"
        style={{ transitionDelay: '0.1s' }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Programs</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover exciting forest adventures for your child at Karura Forest. Our programs build character, confidence, and connection with nature through engaging outdoor experiences.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-6 justify-center">
          {programs.map((program, index) => (
            <ProgramCard key={program.id} program={program} index={index} />
          ))}
        </div>
        
        <div className="text-center mt-10">
          <button 
            onClick={handleRegisterClick}
            className="inline-block py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Register Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProgramHighlights;
