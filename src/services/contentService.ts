import { supabase, isSupabaseAvailable } from './supabaseService';

export interface ContentItem {
  id: string;
  section: string;
  key: string;
  title: string;
  content: string;
  content_type: 'text' | 'html' | 'markdown';
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at?: string;
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
  version: number;
  lastModified: string;
  modifiedBy: string;
}

export interface SectionConfig {
  id: string;
  name: string;
  component: string;
  order: number;
  isActive: boolean;
  layout?: string;
  settings?: Record<string, any>;
}

class ContentService {
  private static instance: ContentService;

  static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  private checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      console.warn('Supabase not configured, using localStorage fallback');
      return false;
    }
    return true;
  }

  async getContent(section?: string): Promise<ContentItem[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        let query = supabase!.from('content_items').select('*');
        
        if (section) {
          query = query.eq('section', section);
        }
        
        const { data, error } = await query
          .eq('status', 'published')
          .order('title');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching content:', error);
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('site-content');
    const allContent = stored ? JSON.parse(stored) : this.getDefaultContent();
    
    if (section) {
      return allContent.filter((item: ContentItem) => item.section === section);
    }
    
    return allContent;
  }

  async getContentByKey(section: string, key: string): Promise<ContentItem | null> {
    const content = await this.getContent(section);
    return content.find(item => item.key === key) || null;
  }

  async saveContent(content: Omit<ContentItem, 'lastModified' | 'version'> & { id?: string }): Promise<ContentItem> {
    const now = new Date().toISOString();
    const newContent: ContentItem = {
      ...content,
      id: content.id || crypto.randomUUID(),
      version: 1,
      lastModified: now
    };

    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('content_items')
          .upsert([newContent])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error saving content:', error);
      }
    }

    // Fallback to localStorage
    const allContent = await this.getContent();
    const existingIndex = allContent.findIndex(item => item.id === newContent.id);
    
    if (existingIndex >= 0) {
      allContent[existingIndex] = { ...newContent, version: allContent[existingIndex].version + 1 };
    } else {
      allContent.push(newContent);
    }
    
    localStorage.setItem('site-content', JSON.stringify(allContent));
    return newContent;
  }

  async getSectionConfig(): Promise<SectionConfig[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('section_config')
          .select('*')
          .eq('isActive', true)
          .order('order');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching section config:', error);
      }
    }

    // Fallback to default sections
    return this.getDefaultSections();
  }

  private getDefaultContent(): ContentItem[] {
    return [
      {
        id: 'hero-heading',
        section: 'hero',
        key: 'heading',
        title: 'Hero Heading',
        content: "Discover Nature's Wonder at Amuse.Ke",
        content_type: 'text',
        status: 'published',
        version: 1,
        lastModified: new Date().toISOString(),
        modifiedBy: 'system',
      },
      {
        id: 'hero-subheading',
        section: 'hero',
        key: 'subheading',
        title: 'Hero Subheading',
        content: "An unforgettable journey of exploration, friendship, and growth in the heart of Karura Forest.",
        content_type: 'text',
        status: 'published',
        version: 1,
        lastModified: new Date().toISOString(),
        modifiedBy: 'system',
      },
      {
        id: 'about-heading',
        section: 'about',
        key: 'heading',
        title: 'About Us Heading',
        content: "Connecting Children With Nature",
        content_type: 'text',
        status: 'published',
        version: 1,
        lastModified: new Date().toISOString(),
        modifiedBy: 'system',
      }
    ];
  }

  private getDefaultSections(): SectionConfig[] {
    return [
      { id: 'hero', name: 'Hero Section', component: 'Hero', order: 1, isActive: true },
      { id: 'announcements', name: 'Announcements', component: 'Announcements', order: 2, isActive: true },
      { id: 'about', name: 'About Us', component: 'AboutSection', order: 3, isActive: true },
      { id: 'programs', name: 'Programs', component: 'ProgramHighlights', order: 4, isActive: true },
      { id: 'calendar', name: 'Calendar', component: 'YearlyCalendar', order: 5, isActive: true },
      { id: 'team', name: 'Team', component: 'TeamSection', order: 6, isActive: true },
      { id: 'gallery', name: 'Gallery', component: 'Gallery', order: 7, isActive: true },
      { id: 'testimonials', name: 'Testimonials', component: 'Testimonials', order: 8, isActive: true },
      { id: 'contact', name: 'Contact', component: 'ContactForm', order: 9, isActive: true }
    ];
  }
}

export const contentService = ContentService.getInstance();
