import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeschoolingProgram from '@/components/forms/HomeschoolingProgram';
import SEOHead from '@/components/SEOHead';

const Homeschooling = () => {
  return (
    <>
      <SEOHead
        title="Homeschooling Outdoor Experiences | Amuse Bush Camp"
        description="Structured integration of physical education and nature immersion with sports modules for homeschooling families. Ages 4-17, flexible 1 day to 4 weeks programs."
        keywords="homeschooling, outdoor education, physical education, nature immersion, sports modules, STEM integration"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-20">
          <HomeschoolingProgram />
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default Homeschooling;
