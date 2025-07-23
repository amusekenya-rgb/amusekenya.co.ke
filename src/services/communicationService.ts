
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: 'direct' | 'notification' | 'system' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  attachment_url?: string;
  related_task_id?: string;
  created_at: string;
  read_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  assigned_by: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
  read: boolean;
  created_at: string;
}

export class CommunicationService {
  private static instance: CommunicationService;

  static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  private checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please set up your Supabase connection first.');
    }
  }

  // Message Management
  async getMessages(userId: string): Promise<Message[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async sendMessage(message: Omit<Message, 'id' | 'created_at' | 'read_at'>): Promise<Message> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;

    // Create notification for recipient
    await this.createNotification({
      user_id: message.recipient_id,
      title: 'New Message',
      message: `New message from ${message.sender_id}: ${message.subject}`,
      type: 'info',
      read: false
    });

    return data;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    this.checkSupabaseAvailable();
    
    const { error } = await supabase!
      .from('messages')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString() 
      })
      .eq('id', messageId);
    
    if (error) throw error;
  }

  // Task Management
  async getTasks(userId: string): Promise<Task[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('tasks')
      .select('*')
      .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('tasks')
      .insert([task])
      .select()
      .single();
    
    if (error) throw error;

    // Create notification for assignee
    await this.createNotification({
      user_id: task.assigned_to,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      type: 'info',
      read: false
    });

    return data;
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    this.checkSupabaseAvailable();
    
    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase!
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Notification Management
  async getNotifications(userId: string): Promise<Notification[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('notifications')
      .insert([notification])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    this.checkSupabaseAvailable();
    
    const { error } = await supabase!
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
  }

  // Email Templates
  async sendEmailNotification(to: string, template: string, data: any): Promise<void> {
    // This would integrate with the email service
    console.log(`Sending email to ${to} with template ${template}`, data);
  }
}

export const communicationService = CommunicationService.getInstance();
