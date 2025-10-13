
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/programs/ProgramDetail";
import EasterCamp from "./pages/camps/EasterCamp";
import SummerCamp from "./pages/camps/SummerCamp";
import EndYearCamp from "./pages/camps/EndYearCamp";
import MidTermCamp from "./pages/camps/MidTermCamp";
import DayCamps from "./pages/camps/DayCamps";
import KenyanExperiencesPage from "./pages/experiences/KenyanExperiences";
import TeamBuilding from "./pages/group-activities/TeamBuilding";
import Parties from "./pages/group-activities/Parties";
import Team from "./pages/about/Team";
import WhoWeAre from "./pages/about/WhoWeAre";
import WhatWeDo from "./pages/about/WhatWeDo";
import AnnouncementsPage from "./pages/Announcements";

import { AuthProvider } from "./hooks/useAuth";
import ProgramRegistration from "./components/ProgramRegistration";
import FloatingFAQ from "./components/FloatingFAQ";
import { useState } from "react";

function App() {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/programs/:programId" element={<ProgramDetail />} />
              
              {/* Camp Routes */}
              <Route path="/camps/easter" element={<EasterCamp />} />
              <Route path="/camps/summer" element={<SummerCamp />} />
              <Route path="/camps/end-year" element={<EndYearCamp />} />
              <Route path="/camps/mid-term/:period" element={<MidTermCamp />} />
              <Route path="/camps/day-camps" element={<DayCamps />} />
              
              {/* Experiences Routes */}
              <Route path="/experiences/kenyan-experiences" element={<KenyanExperiencesPage />} />
              
              {/* Group Activities Routes */}
              <Route path="/group-activities/team-building" element={<TeamBuilding />} />
              <Route path="/group-activities/parties" element={<Parties />} />
          <Route path="/about/team" element={<Team />} />
          <Route path="/about/who-we-are" element={<WhoWeAre />} />
          <Route path="/about/what-we-do" element={<WhatWeDo />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/register/:programId" element={<ProgramRegistration />} />
              <Route path="/register" element={<ProgramRegistration />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingFAQ />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
