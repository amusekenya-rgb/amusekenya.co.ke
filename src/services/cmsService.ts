import { supabase } from '@/integrations/supabase/client';

// Temporarily ignore type errors until tables are created
const supabaseAny = supabase as any;

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content?: string;
  content_type: 'page' | 'post' | 'announcement' | 'campaign' | 'hero_slide' | 'program' | 'site_settings' | 'testimonial' | 'team_member' | 'about_section' | 'service_item';
  status: 'draft' | 'published' | 'archived';
  author_id?: string;
  published_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const cmsService = {
  async createContent(contentData: {
    title: string;
    slug: string;
    content?: string;
    content_type: ContentItem['content_type'];
    status?: ContentItem['status'];
    metadata?: any;
  }): Promise<ContentItem | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabaseAny
        .from('content_items')
        .insert([{
          ...contentData,
          author_id: user?.id,
          status: contentData.status || 'draft',
          published_at: contentData.status === 'published' ? new Date().toISOString() : null
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating content:', error);
      return null;
    }
  },

  async getAllContent(contentType?: ContentItem['content_type']): Promise<ContentItem[]> {
    try {
      let query = supabaseAny
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  },

  async getContentById(id: string): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching content:', error);
      return null;
    }
  },

  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching content by slug:', error);
      return null;
    }
  },

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
      const updateData: any = { ...updates };
      
      // If publishing, set published_at
      if (updates.status === 'published' && !updates.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAny
        .from('content_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error updating content:', error);
      return null;
    }
  },

  async deleteContent(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAny
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  },

  async publishContent(id: string): Promise<ContentItem | null> {
    return this.updateContent(id, { 
      status: 'published',
      published_at: new Date().toISOString()
    });
  },

  async unpublishContent(id: string): Promise<ContentItem | null> {
    return this.updateContent(id, { status: 'draft' });
  },

  // Specialized methods for different content types
  async getHeroSlides(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'hero_slide')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching hero slides:', err);
      return [];
    }
  },

  async getPrograms(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'program')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching programs:', err);
      return [];
    }
  },

  async getPublishedAnnouncements(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'announcement')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching announcements:', err);
      return [];
    }
  },

  async getSiteSettings(): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'site_settings')
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching site settings:', err);
      return null;
    }
  },

  async getTestimonials(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'testimonial')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      return [];
    }
  },

  async getTeamMembers(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'team_member')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching team members:', err);
      return [];
    }
  },

  async getAboutSections(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'about_section')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching about sections:', err);
      return [];
    }
  },

  async getServiceItems(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'service_item')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching service items:', err);
      return [];
    }
  }
};
