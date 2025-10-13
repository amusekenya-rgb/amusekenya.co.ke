import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Baby, School, Tent, Users, MapPin, Target, Heart, Lightbulb, TreePine } from 'lucide-react';
import { cmsService, ContentItem } from '@/services/cmsService';

const iconMap: Record<string, any> = {
  GraduationCap,
  Baby,
  School,
  Tent,
  Users,
  MapPin,
  Target,
  Heart,
  Lightbulb,
  TreePine,
};

const WhatWeDo = () => {
  const [services, setServices] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await cmsService.getServiceItems();
      setServices(data);
    } catch (error) {
      console.error('Error loading service items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="What We Do - Amuse Kenya"
        description="Discover our range of nature-based programs including camps, homeschooling experiences, and team-building activities."
      />
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">What We Do</h1>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="prose prose-lg max-w-none mb-12">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We design and deliver a wide range of programs that complement and enhance learning 
                    through immersive, experiential activities. Our offerings include:
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-12">
                  {services.map((service, index) => {
                    const IconComponent = iconMap[service.metadata?.icon || 'GraduationCap'];
                    return (
                      <Card key={service.id || index} className="border-primary/20 hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                              {IconComponent && <IconComponent className="h-6 w-6 text-primary" />}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground mb-2">{service.title}</h3>
                              <p className="text-muted-foreground">{service.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WhatWeDo;
