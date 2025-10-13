import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TeamBuildingProgram from '@/components/forms/TeamBuildingProgram';

const TeamBuilding = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <TeamBuildingProgram />
      </div>
      
      <Footer />
    </div>
  );
};

export default TeamBuilding;