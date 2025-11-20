import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import ProgramsOverview from '@/components/forms/ProgramsOverview';

const Programs = () => {
  return (
    <>
      <SEOHead
        title="Our Programs | Amuse Kenya Forest Adventures"
        description="Explore our range of programs including daily activities, holiday camps, homeschooling support, birthday parties, team building, and school experiences at Karura Forest."
        keywords="programs, forest activities, outdoor programs Kenya, children programs, nature education, adventure programs, Karura Forest programs"
        canonical="https://amusekenya.co.ke/programs"
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <ProgramsOverview />
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default Programs;