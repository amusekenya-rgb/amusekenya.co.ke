import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TrendingUp, PieChart, BarChart3, Calendar as CalendarIcon, FileText, Clock } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DateRange } from '@/services/financialReportService';
import ProfitLossStatement from './reports/ProfitLossStatement';
import ARAgingReport from './reports/ARAgingReport';
import DailySalesSummary from './reports/DailySalesSummary';
import { cn } from '@/lib/utils';

const FinancialReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const presetRanges = [
    { label: 'Last 7 days', value: () => ({ startDate: subDays(new Date(), 7), endDate: new Date() }) },
    { label: 'Last 30 days', value: () => ({ startDate: subDays(new Date(), 30), endDate: new Date() }) },
    { label: 'Last 90 days', value: () => ({ startDate: subDays(new Date(), 90), endDate: new Date() }) },
    { label: 'This month', value: () => ({ startDate: startOfMonth(new Date()), endDate: new Date() }) },
    { label: 'Last month', value: () => ({ startDate: startOfMonth(subMonths(new Date(), 1)), endDate: endOfMonth(subMonths(new Date(), 1)) }) },
    { label: 'Last 6 months', value: () => ({ startDate: subMonths(new Date(), 6), endDate: new Date() }) },
    { label: 'Year to date', value: () => ({ startDate: new Date(new Date().getFullYear(), 0, 1), endDate: new Date() }) },
  ];

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    setDateRange(preset.value());
    setIsCalendarOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">Financial analysis and reporting</p>
        </div>
        
        {/* Date Range Picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto sm:min-w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">
                {format(dateRange.startDate, 'dd MMM')} - {format(dateRange.endDate, 'dd MMM yyyy')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="flex flex-col sm:flex-row">
              <div className="border-b sm:border-b-0 sm:border-r border-border p-3 space-y-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Quick Select</p>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                  {presetRanges.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-3">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.startDate, to: dateRange.endDate }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ startDate: range.from, endDate: range.to });
                    } else if (range?.from) {
                      setDateRange({ startDate: range.from, endDate: range.from });
                    }
                  }}
                  numberOfMonths={1}
                  className={cn("rounded-md pointer-events-auto")}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs defaultValue="profit-loss" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="profit-loss" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="ar-aging" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">AR Aging</span>
          </TabsTrigger>
          <TabsTrigger value="daily-sales" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Expenses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <ProfitLossStatement dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="ar-aging">
          <ARAgingReport />
        </TabsContent>

        <TabsContent value="daily-sales">
          <DailySalesSummary dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Revenue trends are included in the P&L Statement and Daily Sales tabs
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Expense breakdown is included in the P&L Statement tab
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
