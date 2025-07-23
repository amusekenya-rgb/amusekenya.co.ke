
import { supabase, isSupabaseAvailable } from '../supabaseService';

export interface WorkflowTask {
  id: string;
  title: string;
  description?: string;
  entity_type: string;
  entity_id: string;
  assignee_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class WorkflowTaskService {
  private static checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      console.warn('Supabase not configured, using localStorage fallback');
      return false;
    }
    return true;
  }

  static async getWorkflowTasks(assigneeEmail?: string): Promise<WorkflowTask[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        let query = supabase!.from('workflow_tasks').select('*');
        
        if (assigneeEmail) {
          query = query.eq('assignee_email', assigneeEmail);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching workflow tasks:', error);
      }
    }

    // Fallback to localStorage
    const tasks = localStorage.getItem('workflow_tasks');
    const allTasks = tasks ? JSON.parse(tasks) : this.getMockWorkflowTasks();
    
    if (assigneeEmail) {
      return allTasks.filter((task: WorkflowTask) => task.assignee_email === assigneeEmail);
    }
    
    return allTasks;
  }

  static async createWorkflowTask(task: Omit<WorkflowTask, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowTask> {
    const newTask: WorkflowTask = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('workflow_tasks')
          .insert([newTask])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating workflow task:', error);
      }
    }

    // Fallback to localStorage
    const tasks = await this.getWorkflowTasks();
    tasks.unshift(newTask);
    localStorage.setItem('workflow_tasks', JSON.stringify(tasks));
    return newTask;
  }

  static async updateWorkflowTask(id: string, updates: Partial<WorkflowTask>): Promise<WorkflowTask> {
    const updateData = { 
      ...updates, 
      updated_at: new Date().toISOString(),
      ...(updates.status === 'completed' && { completed_at: new Date().toISOString() })
    };

    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('workflow_tasks')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating workflow task:', error);
      }
    }

    // Fallback to localStorage
    const tasks = await this.getWorkflowTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updateData };
      localStorage.setItem('workflow_tasks', JSON.stringify(tasks));
      return tasks[index];
    }
    throw new Error('Workflow task not found');
  }

  private static getMockWorkflowTasks(): WorkflowTask[] {
    return [
      {
        id: '1',
        title: 'Review Privacy Policy Update',
        description: 'Review and approve updated privacy policy v2.1',
        entity_type: 'policy',
        entity_id: 'policy-1',
        assignee_email: 'ceo@company.com',
        status: 'pending',
        priority: 'high',
        due_date: '2024-02-15',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z'
      },
      {
        id: '2',
        title: 'Security Risk Assessment',
        description: 'Complete quarterly security risk assessment',
        entity_type: 'risk',
        entity_id: 'risk-1',
        assignee_email: 'governance@company.com',
        status: 'in_progress',
        priority: 'medium',
        due_date: '2024-02-28',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-25T00:00:00Z'
      }
    ];
  }
}
