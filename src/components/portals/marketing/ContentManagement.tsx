import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, CheckCircle, Settings, Calendar, ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { HeroSlideEditor } from './editors/HeroSlideEditor';
import { ProgramEditor } from './editors/ProgramEditor';
import { AnnouncementEditorDialog } from './editors/AnnouncementEditorDialog';
import { TestimonialEditor } from './editors/TestimonialEditor';
import { TeamMemberEditor } from './editors/TeamMemberEditor';
import { SiteSettingsEditor } from './editors/SiteSettingsEditor';
import AboutSectionEditor from './editors/AboutSectionEditor';
import ServiceItemEditor from './editors/ServiceItemEditor';
import SeedCMSButton from '@/components/admin/SeedCMSButton';
import AdminGalleryManager from '@/components/AdminGalleryManager';
import EventManagement from '@/components/calendar/EventManagement';
import EventCalendar from '@/components/calendar/EventCalendar';
import { loadEvents, saveEvents, Event } from '@/services/calendarService';

type EditorType = 'hero' | 'program' | 'announcement' | 'testimonial' | 'team' | 'settings' | 'about' | 'service' | null;

const ContentManagement = () => {
  const [heroSlides, setHeroSlides] = useState<ContentItem[]>([]);
  const [programs, setPrograms] = useState<ContentItem[]>([]);
  const [announcements, setAnnouncements] = useState<ContentItem[]>([]);
  const [testimonials, setTestimonials] = useState<ContentItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<ContentItem[]>([]);
  const [aboutSections, setAboutSections] = useState<ContentItem[]>([]);
  const [serviceItems, setServiceItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEditor, setActiveEditor] = useState<EditorType>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadAllContent();
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = () => {
    const events = loadEvents();
    setCalendarEvents(events);
  };

  const handleAddCalendarEvent = (event: Event) => {
    const updatedEvents = [...calendarEvents, event];
    saveEvents(updatedEvents);
    setCalendarEvents(updatedEvents);
    toast({ title: 'Calendar event added successfully' });
  };

  const loadAllContent = async () => {
    setIsLoading(true);
    const [heroData, programData, announcementData, testimonialData, teamData, aboutData, serviceData] = await Promise.all([
      cmsService.getAllContent('hero_slide'),
      cmsService.getAllContent('program'),
      cmsService.getAllContent('announcement'),
      cmsService.getAllContent('testimonial'),
      cmsService.getAllContent('team_member'),
      cmsService.getAllContent('about_section'),
      cmsService.getAllContent('service_item')
    ]);
    setHeroSlides(heroData);
    setPrograms(programData);
    setAnnouncements(announcementData);
    setTestimonials(testimonialData);
    setTeamMembers(teamData);
    setAboutSections(aboutData);
    setServiceItems(serviceData);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const deleted = await cmsService.deleteContent(id);
      if (deleted) {
        toast({ title: 'Content deleted successfully' });
        loadAllContent();
      }
    }
  };

  const handlePublish = async (id: string) => {
    const published = await cmsService.publishContent(id);
    if (published) {
      toast({ title: 'Content published successfully' });
      loadAllContent();
    }
  };

  const openEditor = (type: EditorType, item?: any) => {
    setActiveEditor(type);
    setEditingItem(item || null);
  };

  const closeEditor = () => {
    setActiveEditor(null);
    setEditingItem(null);
  };

  const handleSave = () => {
    loadAllContent();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'published') return <Badge className="bg-green-100 text-green-800">Published</Badge>;
    if (status === 'draft') return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  };

  const renderContentList = (items: ContentItem[], type: EditorType) => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (items.length === 0) return <div className="text-center py-8 text-muted-foreground">No items yet. Create your first one!</div>;

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{item.slug}</p>
                <div className="flex gap-2 items-center">
                  {getStatusBadge(item.status)}
                  {item.metadata?.order && (
                    <span className="text-xs text-muted-foreground">Order: {item.metadata.order}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {item.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => handlePublish(item.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Publish
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEditor(type, item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Website Content Management</h2>
        <p className="text-muted-foreground">Manage all public website content from here</p>
      </div>

      <SeedCMSButton />

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="announcements">News</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-1" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <ImageIcon className="h-4 w-4 mr-1" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hero Section Slides</CardTitle>
              <Button onClick={() => openEditor('hero')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hero Slide
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(heroSlides, 'hero')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Programs</CardTitle>
              <Button onClick={() => openEditor('program')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(programs, 'program')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <Button onClick={() => openEditor('announcement')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Announcement
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(announcements, 'announcement')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Testimonials</CardTitle>
              <Button onClick={() => openEditor('testimonial')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(testimonials, 'testimonial')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button onClick={() => openEditor('team')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(teamMembers, 'team')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar Management</CardTitle>
              <CardDescription>Manage program events and schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <EventManagement onAddEvent={handleAddCalendarEvent} />
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Calendar Overview</h3>
                <EventCalendar events={calendarEvents} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Management</CardTitle>
              <CardDescription>Upload and manage gallery images</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminGalleryManager currentAdminUsername="marketing" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>About Us Sections</CardTitle>
              <Button onClick={() => openEditor('about')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(aboutSections, 'about')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>What We Do - Services</CardTitle>
              <Button onClick={() => openEditor('service')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(serviceItems, 'service')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">Manage global site content like footer information, contact details, and social media links.</p>
                <Button onClick={() => openEditor('settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Site Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activeEditor === 'hero' && (
        <HeroSlideEditor
          isOpen={true}
          onClose={closeEditor}
          slide={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'program' && (
        <ProgramEditor
          isOpen={true}
          onClose={closeEditor}
          program={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'announcement' && (
        <AnnouncementEditorDialog
          isOpen={true}
          onClose={closeEditor}
          announcement={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'testimonial' && (
        <TestimonialEditor
          isOpen={true}
          onClose={closeEditor}
          testimonial={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'team' && (
        <TeamMemberEditor
          isOpen={true}
          onClose={closeEditor}
          member={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'about' && (
        <AboutSectionEditor
          isOpen={true}
          onClose={closeEditor}
          item={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'service' && (
        <ServiceItemEditor
          isOpen={true}
          onClose={closeEditor}
          item={editingItem}
          onSave={handleSave}
        />
      )}

      {activeEditor === 'settings' && (
        <SiteSettingsEditor
          isOpen={true}
          onClose={closeEditor}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ContentManagement;
