
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface AnalyticsMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: 'revenue' | 'customers' | 'employees' | 'performance' | 'efficiency';
  department: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  widget_type: 'chart' | 'metric' | 'table' | 'progress';
  data_source: string;
  configuration: any;
  department: string;
  order_index: number;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  report_type: 'financial' | 'hr' | 'marketing' | 'operations' | 'cross_departmental';
  generated_by: string;
  data: any;
  period_start: string;
  period_end: string;
  status: 'generating' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase is not configured. Please set up your Supabase connection first.');
    }
  }

  // Analytics Metrics
  async getMetrics(department?: string, period?: { start: string; end: string }): Promise<AnalyticsMetric[]> {
    this.checkSupabaseAvailable();
    
    let query = supabase!.from('analytics_metrics').select('*');
    
    if (department) {
      query = query.eq('department', department);
    }
    
    if (period) {
      query = query.gte('period_start', period.start).lte('period_end', period.end);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async recordMetric(metric: Omit<AnalyticsMetric, 'id' | 'created_at'>): Promise<AnalyticsMetric> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('analytics_metrics')
      .insert([metric])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Cross-Departmental Analytics
  async getCrossDepartmentalSummary(): Promise<any> {
    this.checkSupabaseAvailable();
    
    const [
      revenueMetrics,
      employeeMetrics,
      customerMetrics,
      performanceMetrics
    ] = await Promise.all([
      this.getMetrics('ACCOUNTS'),
      this.getMetrics('HR'),
      this.getMetrics('MARKETING'),
      this.getRecentPerformanceData()
    ]);

    return {
      revenue: this.aggregateMetrics(revenueMetrics, 'revenue'),
      employees: this.aggregateMetrics(employeeMetrics, 'employees'),
      customers: this.aggregateMetrics(customerMetrics, 'customers'),
      performance: performanceMetrics
    };
  }

  private aggregateMetrics(metrics: AnalyticsMetric[], type: string): any {
    const total = metrics.reduce((sum, metric) => sum + metric.metric_value, 0);
    const average = metrics.length > 0 ? total / metrics.length : 0;
    const latest = metrics[0]?.metric_value || 0;
    
    return {
      total,
      average,
      latest,
      count: metrics.length,
      trend: this.calculateTrend(metrics)
    };
  }

  private calculateTrend(metrics: AnalyticsMetric[]): number {
    if (metrics.length < 2) return 0;
    
    const recent = metrics.slice(0, Math.floor(metrics.length / 2));
    const older = metrics.slice(Math.floor(metrics.length / 2));
    
    const recentAvg = recent.reduce((sum, m) => sum + m.metric_value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.metric_value, 0) / older.length;
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  // Real-time Performance Data
  async getRecentPerformanceData(): Promise<any> {
    // Simulate real-time data - in production this would query actual performance metrics
    return {
      systemHealth: 98.5,
      activeUsers: 47,
      apiResponseTime: 145,
      errorRate: 0.02,
      lastUpdated: new Date().toISOString()
    };
  }

  // Dashboard Management
  async getDashboardWidgets(department: string): Promise<DashboardWidget[]> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('dashboard_widgets')
      .select('*')
      .eq('department', department)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async createWidget(widget: Omit<DashboardWidget, 'id' | 'created_at'>): Promise<DashboardWidget> {
    this.checkSupabaseAvailable();
    
    const { data, error } = await supabase!
      .from('dashboard_widgets')
      .insert([widget])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Report Generation
  async generateReport(reportConfig: {
    title: string;
    description: string;
    type: Report['report_type'];
    period: { start: string; end: string };
    departments: string[];
    generatedBy: string;
  }): Promise<Report> {
    this.checkSupabaseAvailable();
    
    const reportData = await this.compileReportData(reportConfig);
    
    const report: Omit<Report, 'id' | 'created_at'> = {
      title: reportConfig.title,
      description: reportConfig.description,
      report_type: reportConfig.type,
      generated_by: reportConfig.generatedBy,
      data: reportData,
      period_start: reportConfig.period.start,
      period_end: reportConfig.period.end,
      status: 'completed'
    };

    const { data, error } = await supabase!
      .from('reports')
      .insert([report])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  private async compileReportData(config: any): Promise<any> {
    const data: any = {};
    
    for (const dept of config.departments) {
      const metrics = await this.getMetrics(dept, config.period);
      data[dept] = {
        metrics: metrics,
        summary: this.aggregateMetrics(metrics, dept.toLowerCase())
      };
    }
    
    if (config.type === 'cross_departmental') {
      data.crossDepartmental = await this.getCrossDepartmentalSummary();
    }
    
    return data;
  }

  async getReports(department?: string): Promise<Report[]> {
    this.checkSupabaseAvailable();
    
    let query = supabase!.from('reports').select('*');
    
    if (department) {
      query = query.eq('report_type', department.toLowerCase());
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}

export const analyticsService = AnalyticsService.getInstance();
