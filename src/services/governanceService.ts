
import { supabase, isSupabaseAvailable } from './supabaseService';

export interface Policy {
  id: string;
  title: string;
  content: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  category: string;
  effective_date: string;
  review_date: string;
  owner: string;
  approver?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  title: string;
  description: string;
  category: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  mitigation_plan: string;
  owner: string;
  status: 'open' | 'in_progress' | 'closed' | 'monitoring';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRecord {
  id: string;
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'review_required' | 'in_progress';
  evidence?: string;
  last_assessment: string;
  next_review: string;
  responsible_party: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  category: string;
  access_level: 'public' | 'internal' | 'confidential' | 'restricted';
  tags: string[];
  owner: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  created_at: string;
  updated_at: string;
}

class GovernanceService {
  private static instance: GovernanceService;

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  private checkSupabaseAvailable() {
    if (!isSupabaseAvailable() || !supabase) {
      console.warn('Supabase not configured, using localStorage fallback');
      return false;
    }
    return true;
  }

  // Policy Management
  async getPolicies(): Promise<Policy[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('policies')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    }

    // Fallback to localStorage
    const policies = localStorage.getItem('governance_policies');
    return policies ? JSON.parse(policies) : this.getMockPolicies();
  }

  async createPolicy(policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'>): Promise<Policy> {
    const newPolicy: Policy = {
      ...policy,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('policies')
          .insert([newPolicy])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating policy:', error);
      }
    }

    // Fallback to localStorage
    const policies = await this.getPolicies();
    policies.unshift(newPolicy);
    localStorage.setItem('governance_policies', JSON.stringify(policies));
    return newPolicy;
  }

  async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
    const updateData = { ...updates, updated_at: new Date().toISOString() };

    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('policies')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error updating policy:', error);
      }
    }

    // Fallback to localStorage
    const policies = await this.getPolicies();
    const index = policies.findIndex(p => p.id === id);
    if (index !== -1) {
      policies[index] = { ...policies[index], ...updateData };
      localStorage.setItem('governance_policies', JSON.stringify(policies));
      return policies[index];
    }
    throw new Error('Policy not found');
  }

  // Risk Management
  async getRiskAssessments(): Promise<RiskAssessment[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('risk_assessments')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching risk assessments:', error);
      }
    }

    // Fallback to localStorage
    const risks = localStorage.getItem('governance_risks');
    return risks ? JSON.parse(risks) : this.getMockRisks();
  }

  async createRiskAssessment(risk: Omit<RiskAssessment, 'id' | 'created_at' | 'updated_at'>): Promise<RiskAssessment> {
    const newRisk: RiskAssessment = {
      ...risk,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('risk_assessments')
          .insert([newRisk])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating risk assessment:', error);
      }
    }

    // Fallback to localStorage
    const risks = await this.getRiskAssessments();
    risks.unshift(newRisk);
    localStorage.setItem('governance_risks', JSON.stringify(risks));
    return newRisk;
  }

  // Compliance Management
  async getComplianceRecords(): Promise<ComplianceRecord[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('compliance_records')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching compliance records:', error);
      }
    }

    // Fallback to localStorage
    const compliance = localStorage.getItem('governance_compliance');
    return compliance ? JSON.parse(compliance) : this.getMockCompliance();
  }

  // Document Management
  async getDocuments(): Promise<Document[]> {
    if (this.checkSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('governance_documents')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    }

    // Fallback to localStorage
    const documents = localStorage.getItem('governance_documents');
    return documents ? JSON.parse(documents) : this.getMockDocuments();
  }

  // Mock data methods
  private getMockPolicies(): Policy[] {
    return [
      {
        id: '1',
        title: 'Data Privacy Policy',
        content: 'Comprehensive data privacy policy covering GDPR compliance...',
        version: '2.1',
        status: 'approved',
        category: 'Privacy',
        effective_date: '2024-01-01',
        review_date: '2024-12-31',
        owner: 'governance@company.com',
        approver: 'ceo@company.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        title: 'Information Security Policy',
        content: 'Guidelines for maintaining information security...',
        version: '1.3',
        status: 'review',
        category: 'Security',
        effective_date: '2024-02-01',
        review_date: '2024-11-30',
        owner: 'governance@company.com',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z'
      }
    ];
  }

  private getMockRisks(): RiskAssessment[] {
    return [
      {
        id: '1',
        title: 'Data Breach Risk',
        description: 'Risk of unauthorized access to customer data',
        category: 'Security',
        probability: 'medium',
        impact: 'high',
        risk_level: 'high',
        mitigation_plan: 'Implement additional security controls and monitoring',
        owner: 'security@company.com',
        status: 'in_progress',
        due_date: '2024-06-30',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        title: 'Compliance Violation',
        description: 'Risk of GDPR compliance violations',
        category: 'Compliance',
        probability: 'low',
        impact: 'high',
        risk_level: 'medium',
        mitigation_plan: 'Regular compliance audits and staff training',
        owner: 'governance@company.com',
        status: 'monitoring',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z'
      }
    ];
  }

  private getMockCompliance(): ComplianceRecord[] {
    return [
      {
        id: '1',
        framework: 'GDPR',
        requirement: 'Right to be Forgotten',
        status: 'compliant',
        evidence: 'Data deletion procedures implemented and tested',
        last_assessment: '2024-01-15',
        next_review: '2024-07-15',
        responsible_party: 'governance@company.com',
        notes: 'All systems support automated data deletion',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        framework: 'GDPR',
        requirement: 'Data Portability',
        status: 'in_progress',
        last_assessment: '2024-01-10',
        next_review: '2024-04-10',
        responsible_party: 'development@company.com',
        notes: 'Export functionality in development',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z'
      }
    ];
  }

  private getMockDocuments(): Document[] {
    return [
      {
        id: '1',
        title: 'GDPR Compliance Manual',
        description: 'Complete guide to GDPR compliance procedures',
        file_url: '/documents/gdpr-manual.pdf',
        file_type: 'pdf',
        category: 'Compliance',
        access_level: 'internal',
        tags: ['GDPR', 'Privacy', 'Manual'],
        owner: 'governance@company.com',
        version: '1.2',
        status: 'approved',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        title: 'Security Incident Response Plan',
        description: 'Procedures for handling security incidents',
        file_url: '/documents/incident-response.pdf',
        file_type: 'pdf',
        category: 'Security',
        access_level: 'confidential',
        tags: ['Security', 'Incident', 'Response'],
        owner: 'security@company.com',
        version: '2.0',
        status: 'approved',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-20T00:00:00Z'
      }
    ];
  }
}

export const governanceService = GovernanceService.getInstance();
