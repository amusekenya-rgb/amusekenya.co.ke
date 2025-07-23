
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hire_date: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  manager_id?: string;
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period_start: string;
  review_period_end: string;
  overall_rating: number;
  goals_achieved: number;
  areas_of_strength: string[];
  areas_for_improvement: string[];
  goals_next_period: string[];
  comments: string;
  status: 'draft' | 'submitted' | 'approved' | 'final';
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours?: number;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'sick_leave' | 'vacation';
  notes?: string;
  created_at: string;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  training_name: string;
  training_type: 'internal' | 'external' | 'online' | 'certification';
  start_date: string;
  end_date: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'failed';
  completion_percentage: number;
  certificate_url?: string;
  cost: number;
  created_at: string;
}

export interface JobApplication {
  id: string;
  position_title: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  resume_url: string;
  cover_letter?: string;
  application_date: string;
  status: 'received' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  interview_date?: string;
  notes?: string;
  created_at: string;
}

export class EmployeeService {
  private static instance: EmployeeService;

  static getInstance(): EmployeeService {
    if (!EmployeeService.instance) {
      EmployeeService.instance = new EmployeeService();
    }
    return EmployeeService.instance;
  }

  private checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please set up your Supabase connection first.');
    }
  }

  // Employee Management
  async getEmployees(): Promise<Employee[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('employees')
      .insert([employee])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Performance Reviews
  async getPerformanceReviews(employeeId?: string): Promise<PerformanceReview[]> {
    this.checkSupabaseAvailable();
    
    let query = supabase!
      .from('performance_reviews')
      .select('*');
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createPerformanceReview(review: Omit<PerformanceReview, 'id' | 'created_at' | 'updated_at'>): Promise<PerformanceReview> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('performance_reviews')
      .insert([review])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Attendance Tracking
  async getAttendanceRecords(employeeId?: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> {
    this.checkSupabaseAvailable();
    
    let query = supabase!
      .from('attendance_records')
      .select('*');
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async recordAttendance(attendance: Omit<AttendanceRecord, 'id' | 'created_at'>): Promise<AttendanceRecord> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('attendance_records')
      .insert([attendance])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Training Management
  async getTrainingRecords(employeeId?: string): Promise<TrainingRecord[]> {
    this.checkSupabaseAvailable();
    
    let query = supabase!
      .from('training_records')
      .select('*');
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    
    const { data, error } = await query.order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async enrollInTraining(training: Omit<TrainingRecord, 'id' | 'created_at'>): Promise<TrainingRecord> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('training_records')
      .insert([training])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Recruitment Management
  async getJobApplications(): Promise<JobApplication[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('job_applications')
      .select('*')
      .order('application_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createJobApplication(application: Omit<JobApplication, 'id' | 'created_at'>): Promise<JobApplication> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('job_applications')
      .insert([application])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateApplicationStatus(id: string, status: JobApplication['status'], notes?: string): Promise<JobApplication> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('job_applications')
      .update({ status, notes })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export const employeeService = EmployeeService.getInstance();
