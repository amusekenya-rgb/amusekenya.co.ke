import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeschoolingProgram from '@/components/forms/HomeschoolingProgram';
import LittleForestProgram from '@/components/forms/LittleForestProgram';
import SchoolExperienceProgram from '@/components/forms/SchoolExperienceProgram';
import TeamBuildingProgram from '@/components/forms/TeamBuildingProgram';
import KenyanExperiencesProgram from '@/components/forms/KenyanExperiencesProgram';
import DayCampsProgram from '@/components/forms/DayCampsProgram';
import NotFound from '@/pages/NotFound';

const ProgramDetail = () => {
  const { programId } = useParams();

  const renderProgram = () => {
    switch (programId) {
      case 'homeschooling':
        return <HomeschoolingProgram />;
      case 'little-forest':
        return <LittleForestProgram />;
      case 'school-experience':
        return <SchoolExperienceProgram />;
      case 'team-building':
        return <TeamBuildingProgram />;
      case 'kenyan-experiences':
        return <KenyanExperiencesProgram />;
      case 'day-camps':
        return <DayCampsProgram campTitle="Nairobi Day Camps" />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        {renderProgram()}
      </div>
      
      <Footer />
    </div>
  );
};

export default ProgramDetail;