import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Eye, Heart, CheckCircle, FileText } from 'lucide-react';
import { cmsService, ContentItem } from '@/services/cmsService';

const iconMap: Record<string, any> = {
  Target,
  Eye,
  Heart,
  CheckCircle,
  FileText,
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
      const otherSections = data.filter(s => s.metadata?.section_type !== 'intro');
      setIntroSection(intro || null);
      setSections(otherSections);
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

                <div className="grid gap-8 md:grid-cols-2">
                  {sections.map((section, index) => {
                    const IconComponent = iconMap[section.metadata?.icon || 'Target'];
                    return (
                      <Card key={section.id || index} className="border-primary/20 hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                              {IconComponent && <IconComponent className="h-6 w-6 text-primary" />}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground mb-2">{section.title}</h3>
                              <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
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

export default WhoWeAre;
