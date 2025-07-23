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
    title: "Little Explorers",
    ageRange: "Ages 5-7",
    description: "A gentle introduction to forest life through guided sensory activities, nature art, and short trail walks designed for our youngest adventurers.",
    iconType: "TreePine",
    colorAccent: "accent-forest",
    startDate: "June 15, 2024",
    duration: "1 Week"
  },
  {
    id: '2',
    title: "Junior Rangers",
    ageRange: "Ages 8-11",
    description: "Develop outdoor skills through shelter building, wildlife tracking, and forest navigation while fostering teamwork and independence.",
    iconType: "TentTree",
    colorAccent: "accent-earth",
    startDate: "July 8, 2024",
    duration: "2 Weeks"
  },
  {
    id: '3',
    title: "Forest Guardians",
    ageRange: "Ages 12-15",
    description: "Deepen ecological understanding through conservation projects, biodiversity surveys, and overnight camping experiences.",
    iconType: "Bird",
    colorAccent: "accent-sky",
    startDate: "August 3, 2024",
    duration: "3 Weeks"
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Summer Programs</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the perfect summer adventure for your child. Our programs are designed to nurture a deep connection with nature while developing important life skills.
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
