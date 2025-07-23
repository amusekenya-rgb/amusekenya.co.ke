
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ContentItemEditor from '@/components/content/ContentItemEditor';
import ContentItemList from '@/components/content/ContentItemList';
import { contentService, ContentItem } from '@/services/contentService';
import { useContent } from '@/hooks/useContent';

interface AdminContentManagerProps {
  currentAdminUsername: string;
}

const initialSections = [
  { id: 'hero', name: 'Hero Section' },
  { id: 'about', name: 'About Us' },
  { id: 'team', name: 'Team Members' },
  { id: 'programs', name: 'Programs' },
  { id: 'gallery', name: 'Gallery' },
  { id: 'contact', name: 'Contact' },
  { id: 'footer', name: 'Footer' },
];

const AdminContentManager: React.FC<AdminContentManagerProps> = ({ currentAdminUsername }) => {
  const [selectedSection, setSelectedSection] = useState<string>('hero');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content_type: 'html' as 'text' | 'html' | 'markdown',
    status: 'published' as 'draft' | 'published' | 'scheduled',
    meta_title: '',
    meta_description: ''
  });

  const { content, isLoading, refreshContent } = useContent(selectedSection);

  const handleEditClick = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      content_type: item.content_type,
      status: item.status,
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || ''
    });
  };

  const handleSave = async () => {
    if (!editingItem) return;
    
    try {
      await contentService.saveContent({
        ...editingItem,
        ...formData,
        modifiedBy: currentAdminUsername,
      });
      
      setEditingItem(null);
      refreshContent();
      
      toast({
        title: "Content updated",
        description: `${formData.title} has been updated successfully`,
      });
      
      console.log(`Admin ${currentAdminUsername} updated content: ${editingItem.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  const handleAddNew = () => {
    const newItem: ContentItem = {
      id: crypto.randomUUID(),
      section: selectedSection,
      key: `custom_${Date.now()}`,
      title: 'New Content Item',
      content: '<p>Add your content here</p>',
      content_type: 'html',
      status: 'draft',
      version: 1,
      lastModified: new Date().toISOString(),
      modifiedBy: currentAdminUsername,
    };
    
    handleEditClick(newItem);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Content Management</CardTitle>
          <CardDescription>
            Create, edit, and manage rich content across the website with SEO optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedSection} onValueChange={setSelectedSection}>
            <TabsList className="mb-4 overflow-x-auto flex flex-nowrap">
              {initialSections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="min-w-fit">
                  {section.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={selectedSection}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {initialSections.find(s => s.id === selectedSection)?.name} Content
                </h3>
                <Button onClick={handleAddNew}>Add New Content</Button>
              </div>
              
              {editingItem ? (
                <ContentItemEditor
                  editingItem={editingItem}
                  formData={formData}
                  onFormDataChange={setFormData}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <ContentItemList
                  content={content}
                  isLoading={isLoading}
                  onEdit={handleEditClick}
                  onAddNew={handleAddNew}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContentManager;
