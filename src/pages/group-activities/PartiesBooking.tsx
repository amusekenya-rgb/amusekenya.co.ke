import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PartiesProgram from '@/components/forms/PartiesProgram';

const PartiesBooking = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <PartiesProgram />
      </div>
      
      <Footer />
    </div>
  );
};

export default PartiesBooking;
