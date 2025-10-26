import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, Eye, Heart, CheckCircle, FileText, Leaf, Users, Smile, Globe } from 'lucide-react';
import { cmsService, ContentItem } from '@/services/cmsService';

const iconMap: Record<string, any> = {
  Target,
  Eye,
  Heart,
  CheckCircle,
  FileText,
  Leaf,
  Users,
  Smile,
  Globe,
};

const WhoWeAre = () => {
  const [sections, setSections] = useState<ContentItem[]>([]);
  const [introSection, setIntroSection] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await cmsService.getAboutSections();
      const intro = data.find(s => s.metadata?.section_type === 'intro');
      const pillars = data.filter(s => s.metadata?.section_type !== 'intro')
        .sort((a, b) => {
          const orderA = a.metadata?.order || 0;
          const orderB = b.metadata?.order || 0;
          return orderA - orderB;
        });
      setIntroSection(intro || null);
      setSections(pillars);
    } catch (error) {
      console.error('Error loading about sections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Who We Are - Amuse Kenya"
        description="Learn about Amuse Kenya's mission to make outdoor learning meaningful, accessible, and unforgettable for children in Kenya."
      />
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Who We Are</h1>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="prose prose-lg max-w-none mb-12">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {introSection?.content || 
                      "At Amuse, we believe that the best way for children to learn is by exploring, experiencing, and engaging with the world around them. We specialize in creating outdoor programs that inspire curiosity, foster independence, and build lasting skills—all while having fun in nature."}
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-6">Our Pillars</h2>
                  <Card className="border-primary/20">
                    <CardContent className="pt-6">
                      <Accordion type="single" collapsible className="w-full">
                        {sections.map((section, index) => {
                          const IconComponent = iconMap[section.metadata?.icon || 'Target'];
                          return (
                            <AccordionItem key={section.id || index} value={`item-${index}`}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3 text-left">
                                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                    {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
                                  </div>
                                  <span className="text-lg font-semibold text-foreground">{section.title}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="text-muted-foreground leading-relaxed pl-14 pr-4 pb-2 space-y-4">
                                  {section.content.split('\n\n').map((paragraph, idx) => (
                                    <p key={idx} className="whitespace-pre-line">
                                      {paragraph}
                                    </p>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
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

export default WhoWeAre;
