import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DayCampsProgram from '@/components/forms/DayCampsProgram';

const DayCamps = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <DayCampsProgram />
      </div>
      
      <Footer />
    </div>
  );
};

export default DayCamps;