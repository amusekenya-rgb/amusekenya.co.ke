import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Gift } from 'lucide-react';
import birthdayImage from '@/assets/birthday.jpg';

const Parties = () => {
  return (
    <>
      <SEOHead
        title="Parties & Celebrations | Amuse Kenya Outdoor Events"
        description="Host unforgettable outdoor birthday parties and celebrations at Karura Forest. Customized party packages with nature activities, games, catering, and decorations for groups of 10-50 guests."
        keywords="birthday parties Kenya, outdoor celebrations, children's party venue, forest parties, group events, party packages Karura, outdoor party venue Nairobi"
        canonical="https://amusekenya.co.ke/group-activities/parties"
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[400px] overflow-hidden">
          <img 
            src={birthdayImage} 
            alt="Parties & Celebrations" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-900/80 to-forest-600/60 flex items-center">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Parties & Celebrations</h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Create unforgettable memories with outdoor birthday parties and group celebrations
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-forest-900">Celebrate Outdoors</h2>
              <p className="text-gray-700 leading-relaxed">
                Make your special occasion extraordinary! Our outdoor party packages combine nature, 
                adventure, and celebration for birthday parties, family gatherings, and group events.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Gift className="text-forest-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Party Types</h3>
                    <p className="text-gray-600">Birthdays, anniversaries, family reunions, and more</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="text-forest-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Group Size</h3>
                    <p className="text-gray-600">10-50 guests</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="text-forest-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Duration</h3>
                    <p className="text-gray-600">Half-day or full-day packages available</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="text-forest-600 mt-1" size={20} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Location</h3>
                    <p className="text-gray-600">Amuse Kenya Outdoor Center</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link to="/group-activities/parties/booking">
                  <Button size="lg" className="bg-forest-600 hover:bg-forest-700">
                    Book Your Party
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-forest-900">What's Included</h3>
              <ul className="space-y-3">
                {[
                  'Customized party themes',
                  'Outdoor adventure activities',
                  'Party games and entertainment',
                  'Dedicated party area',
                  'Basic decorations and setup',
                  'Professional event coordination',
                  'Photography opportunities',
                  'Age-appropriate activities',
                  'Safety equipment and supervision',
                  'Flexible catering options'
                ].map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-forest-600 font-bold">•</span>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-forest-50 p-6 rounded-lg mt-6">
                <h4 className="font-semibold text-forest-900 mb-2">Popular Add-Ons</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Custom cake and catering services</li>
                  <li>• Professional photography package</li>
                  <li>• Special activity sessions (rock climbing, kayaking)</li>
                  <li>• Party favors and gift bags</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default Parties;