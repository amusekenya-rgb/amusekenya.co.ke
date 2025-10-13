import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Clock } from 'lucide-react';
import campingImage from '@/assets/camping.jpg';
import HolidayCampForm from '@/components/forms/HolidayCampForm';

const EasterCamp = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Program Information */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    Easter Camp
                  </h1>
                  <p className="text-lg text-muted-foreground">Holiday Adventure</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join us for an unforgettable Easter holiday filled with adventure, learning, and fun! 
                Our Easter Camp combines outdoor activities with educational experiences in nature.
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <img 
                src={campingImage} 
                alt="Children enjoying Easter camp activities" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Camp Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Duration</h3>
                  <p className="text-muted-foreground">5-Day Camp Program</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Age Group</h3>
                  <p className="text-muted-foreground">3-17 years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Location</h3>
                  <p className="text-muted-foreground">Karura Forest & Ngong Sanctuary</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Time</h3>
                  <p className="text-muted-foreground">8:30 AM - 3:30 PM</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-2xl font-bold text-primary mb-4">Camp Highlights</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Nature hikes and wildlife exploration
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Team building games and activities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Easter-themed treasure hunts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Outdoor cooking and campfire sessions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Arts and crafts with natural materials
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Environmental education workshops
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Swimming and water activities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Experienced supervision and safety protocols
                </li>
              </ul>
            </div>
          </div>

          {/* Registration Form */}
          <HolidayCampForm campType="easter" campTitle="Easter Camp" />
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EasterCamp;