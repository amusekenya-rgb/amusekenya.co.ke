import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, TrendingUp, TrendingDown, Minus, DollarSign, Users, Receipt } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { financialReportService, DailySalesData, DateRange } from '@/services/financialReportService';
import { format, parseISO } from 'date-fns';

interface Props {
  dateRange: DateRange;
}

const DailySalesSummary: React.FC<Props> = ({ dateRange }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailySalesData[]>([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const salesData = await financialReportService.generateDailySalesSummary(dateRange);
      setData(salesData);
    } catch (error) {
      console.error('Error loading daily sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleExportCSV = () => {
    financialReportService.exportDailySalesToCSV(data);
  };

  const handleExportPDF = () => {
    financialReportService.exportDailySalesToPDF(data);
  };

  // Calculate totals
  const totals = data.reduce(
    (acc, day) => ({
      totalRevenue: acc.totalRevenue + day.totalRevenue,
      paymentsAmount: acc.paymentsAmount + day.paymentsAmount,
      paymentsReceived: acc.paymentsReceived + day.paymentsReceived,
      campRevenue: acc.campRevenue + day.campRevenue,
      campRegistrations: acc.campRegistrations + day.campRegistrations,
      invoicesAmount: acc.invoicesAmount + day.invoicesAmount,
      invoicesCreated: acc.invoicesCreated + day.invoicesCreated,
    }),
    { totalRevenue: 0, paymentsAmount: 0, paymentsReceived: 0, campRevenue: 0, campRegistrations: 0, invoicesAmount: 0, invoicesCreated: 0 }
  );

  // Calculate daily average
  const daysWithData = data.filter(d => d.totalRevenue > 0).length;
  const avgDailyRevenue = daysWithData > 0 ? totals.totalRevenue / daysWithData : 0;

  // Find trend (compare first half to second half)
  const halfIndex = Math.floor(data.length / 2);
  const firstHalfRevenue = data.slice(0, halfIndex).reduce((sum, d) => sum + d.totalRevenue, 0);
  const secondHalfRevenue = data.slice(halfIndex).reduce((sum, d) => sum + d.totalRevenue, 0);
  const trend = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

  // Format chart data for better display
  const chartData = data.map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), 'dd MMM'),
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Daily Sales Summary</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(dateRange.startDate, 'dd MMM')} - {format(dateRange.endDate, 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totals.totalRevenue)}</div>
            <div className="flex items-center gap-1 mt-1">
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : trend < 0 ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={`text-xs ${trend > 0 ? 'text-primary' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-accent" />
              Payments Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(totals.paymentsAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.paymentsReceived} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary-foreground" />
              Camp Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">{formatCurrency(totals.campRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">{totals.campRegistrations} registrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(avgDailyRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">{daysWithData} days with activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend</CardTitle>
          <CardDescription>Daily revenue breakdown over selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    interval={Math.floor(chartData.length / 10)}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    name="Total Revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              No revenue data for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Sources Comparison</CardTitle>
          <CardDescription>Payments vs Camp Registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    interval={Math.floor(chartData.length / 10)}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="paymentsAmount"
                    name="Payments"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="campRevenue"
                    name="Camp Revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Breakdown</CardTitle>
          <CardDescription>Detailed daily transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="min-w-full">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Invoices</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Payments</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Camp Regs</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((day) => (
                    <tr key={day.date} className="hover:bg-muted/30">
                      <td className="p-3 text-sm font-medium text-foreground">
                        {format(parseISO(day.date), 'EEE, dd MMM')}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {day.invoicesCreated > 0 && (
                          <span>{day.invoicesCreated} ({formatCurrency(day.invoicesAmount)})</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {day.paymentsReceived > 0 && (
                          <span>{day.paymentsReceived} ({formatCurrency(day.paymentsAmount)})</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {day.campRegistrations > 0 && (
                          <span>{day.campRegistrations} ({formatCurrency(day.campRevenue)})</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right font-medium text-foreground">
                        {day.totalRevenue > 0 ? formatCurrency(day.totalRevenue) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySalesSummary;
