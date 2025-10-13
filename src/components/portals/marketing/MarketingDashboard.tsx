
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, TrendingUp, Target, Plus } from "lucide-react";
import { leadsService } from '@/services/leadsService';

const MarketingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    conversionRate: 0,
    activeCampaigns: 0,
    emailOpenRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const leads = await leadsService.getAllLeads();
      const safeLeads = Array.isArray(leads) ? leads : [];
      const convertedLeads = safeLeads.filter(l => l.status === 'converted');
      const conversionRate = safeLeads.length > 0 ? (convertedLeads.length / safeLeads.length) * 100 : 0;

      setMetrics({
        totalLeads: safeLeads.length,
        conversionRate: Math.round(conversionRate),
        activeCampaigns: 3, // TODO: Fetch from campaigns table
        emailOpenRate: 68 // TODO: Implement email tracking
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CRM Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : metrics.totalLeads}
            </div>
            <p className="text-xs text-muted-foreground">
              From website forms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${metrics.conversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Leads to customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : metrics.activeCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `${metrics.emailOpenRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Industry avg: 21%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Management */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>Active marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-3">
              <h4 className="font-medium">Summer Program Launch</h4>
              <p className="text-sm text-muted-foreground">Email campaign</p>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="default">Active</Badge>
                <span className="text-xs text-muted-foreground">72% open rate</span>
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="font-medium">Parent Referral Program</h4>
              <p className="text-sm text-muted-foreground">Social media campaign</p>
              <div className="flex justify-between items-center mt-2">
                <Badge variant="secondary">Planning</Badge>
                <span className="text-xs text-muted-foreground">Starts next week</span>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;
