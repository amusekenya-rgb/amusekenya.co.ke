import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, DollarSign, Users, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { CampRegistration } from '@/types/campRegistration';
import { exportService } from '@/services/exportService';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export const CampReportsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await campRegistrationService.getAllRegistrations();
      setRegistrations(data);
      
      const summaryData = exportService.calculateSummary(data);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const campTypeData = Object.entries(summary.campTypeCounts).map(([name, count]) => ({
    name: name.replace('-', ' ').toUpperCase(),
    count,
  }));

  const paymentStatusData = [
    { name: 'Paid', value: summary.paidRevenue, count: registrations.filter(r => r.payment_status === 'paid').length },
    { name: 'Unpaid', value: summary.unpaidRevenue, count: registrations.filter(r => r.payment_status === 'unpaid').length },
    { name: 'Partial', value: summary.partialRevenue, count: registrations.filter(r => r.payment_status === 'partial').length },
  ].filter(item => item.count > 0);

  // Revenue by camp type
  const revenueByType = Object.keys(summary.campTypeCounts).map(campType => {
    const regs = registrations.filter(r => r.camp_type === campType);
    const revenue = regs.reduce((sum, r) => sum + r.total_amount, 0);
    return {
      name: campType.replace('-', ' ').toUpperCase(),
      revenue: Math.round(revenue),
      registrations: regs.length,
    };
  });

  // Children age distribution
  const ageDistribution: Record<string, number> = {};
  registrations.forEach(reg => {
    reg.children.forEach(child => {
      const age = child.ageRange || 'Unknown';
      ageDistribution[age] = (ageDistribution[age] || 0) + 1;
    });
  });

  const ageData = Object.entries(ageDistribution).map(([age, count]) => ({
    age,
    count,
  }));

  // Registration type breakdown
  const registrationTypeData = [
    { name: 'Online Only', count: registrations.filter(r => r.registration_type === 'online_only').length },
    { name: 'Online Paid', count: registrations.filter(r => r.registration_type === 'online_paid').length },
    { name: 'Ground', count: registrations.filter(r => r.registration_type === 'ground_registration').length },
  ].filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: KES {Math.round(summary.averagePerRegistration).toLocaleString()} per registration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalChildren} children enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">KES {summary.paidRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((summary.paidRevenue / summary.totalRevenue) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CalendarIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">KES {summary.unpaidRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid + Partial: KES {(summary.unpaidRevenue + summary.partialRevenue).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Camp Type</CardTitle>
            <CardDescription>Total revenue generated per camp type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue (KES)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
            <CardDescription>Revenue breakdown by payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, count }) => `${name}: KES ${value.toLocaleString()} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrations by Camp Type</CardTitle>
            <CardDescription>Number of registrations per camp</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Children Age Distribution</CardTitle>
            <CardDescription>Number of children by age range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Children" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Type Breakdown</CardTitle>
          <CardDescription>Distribution of online vs ground registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={registrationTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {registrationTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
