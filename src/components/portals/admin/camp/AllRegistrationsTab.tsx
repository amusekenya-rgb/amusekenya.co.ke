import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, Eye, Download, FileSpreadsheet, FileText, QrCode, 
  Mail, CheckCircle, XCircle, Trash2, Calendar as CalendarIcon,
  Filter, X
} from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { CampRegistration } from '@/types/campRegistration';
import { toast } from 'sonner';
import { RegistrationDetailsDialog } from './RegistrationDetailsDialog';
import { exportService } from '@/services/exportService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const AllRegistrationsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<CampRegistration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Advanced filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;
      if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter;
      if (dateFrom) filters.startDate = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) filters.endDate = format(dateTo, 'yyyy-MM-dd');

      let data = await campRegistrationService.getAllRegistrations(filters);
      
      // Apply client-side filters
      if (registrationTypeFilter !== 'all') {
        data = data.filter(reg => reg.registration_type === registrationTypeFilter);
      }
      
      if (minAmount) {
        data = data.filter(reg => reg.total_amount >= parseFloat(minAmount));
      }
      
      if (maxAmount) {
        data = data.filter(reg => reg.total_amount <= parseFloat(maxAmount));
      }

      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [campTypeFilter, paymentFilter, registrationTypeFilter, dateFrom, dateTo]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadRegistrations();
      return;
    }

    try {
      setLoading(true);
      const data = await campRegistrationService.searchRegistrations(searchTerm);
      setRegistrations(data);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (registration: CampRegistration) => {
    setSelectedRegistration(registration);
    setDetailsOpen(true);
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      partial: 'secondary',
      unpaid: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(registrations.map(reg => reg.id!));
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === registrations.length);
  };

  const getSelectedRegistrations = () => {
    return registrations.filter(reg => selectedIds.has(reg.id!));
  };

  // Bulk actions
  const handleBulkPaymentUpdate = async (status: 'paid' | 'unpaid' | 'partial') => {
    const selected = getSelectedRegistrations();
    if (selected.length === 0) {
      toast.error('No registrations selected');
      return;
    }

    try {
      for (const reg of selected) {
        await campRegistrationService.updatePaymentStatus(reg.id!, status);
      }
      toast.success(`Updated ${selected.length} registration(s) to ${status}`);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadRegistrations();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'cancelled') => {
    const selected = getSelectedRegistrations();
    if (selected.length === 0) {
      toast.error('No registrations selected');
      return;
    }

    try {
      for (const reg of selected) {
        await campRegistrationService.updateRegistration(reg.id!, { status });
      }
      toast.success(`Updated ${selected.length} registration(s) to ${status}`);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadRegistrations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    exportService.exportToCSV(dataToExport, `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${dataToExport.length} registrations to CSV`);
  };

  const handleExportPDF = () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    exportService.exportToPDF(dataToExport, `registrations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success(`Exported ${dataToExport.length} registrations to PDF`);
  };

  const handleExportDetailedPDF = () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    exportService.exportDetailedPDF(dataToExport, `detailed-registrations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success(`Exported detailed registrations to PDF`);
  };

  const handleExportQRCodes = async () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    toast.info('Generating QR codes... This may take a moment.');
    await exportService.exportQRCodes(dataToExport, `qr-codes-${format(new Date(), 'yyyy-MM-dd')}.zip`);
    toast.success(`Exported ${dataToExport.length} QR codes`);
  };

  const clearFilters = () => {
    setCampTypeFilter('all');
    setPaymentFilter('all');
    setRegistrationTypeFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
  };

  const hasActiveFilters = campTypeFilter !== 'all' || paymentFilter !== 'all' || 
    registrationTypeFilter !== 'all' || dateFrom || dateTo || minAmount || maxAmount || searchTerm;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Registrations ({registrations.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportDetailedPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Detailed
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportQRCodes}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Codes
              </Button>
            </div>
          </div>

          {/* Search and basic filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by registration number, name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={campTypeFilter} onValueChange={setCampTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Camp Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Camps</SelectItem>
                <SelectItem value="easter">Easter</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="end-year">End Year</SelectItem>
                <SelectItem value="mid-term-1">Mid Term 1</SelectItem>
                <SelectItem value="mid-term-2">Mid Term 2</SelectItem>
                <SelectItem value="mid-term-3">Mid Term 3</SelectItem>
                <SelectItem value="day-camps">Day Camps</SelectItem>
                <SelectItem value="little-forest">Little Forest</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvancedFilters ? 'Hide' : 'More'} Filters
            </Button>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Registration Type</label>
                <Select value={registrationTypeFilter} onValueChange={setRegistrationTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online_only">Online Only</SelectItem>
                    <SelectItem value="online_paid">Online Paid</SelectItem>
                    <SelectItem value="ground_registration">Ground</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Min Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Max Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-2 text-sm text-muted-foreground">
              Active filters applied. <Button variant="link" size="sm" onClick={clearFilters} className="p-0 h-auto">Clear all</Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Bulk actions toolbar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handleBulkPaymentUpdate('paid')}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Paid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkPaymentUpdate('unpaid')}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Mark Unpaid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('cancelled')}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Reg Number</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Camp Type</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(reg.id!)}
                          onCheckedChange={() => handleSelectOne(reg.id!)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{reg.registration_number}</TableCell>
                      <TableCell>{reg.parent_name}</TableCell>
                      <TableCell className="capitalize">{reg.camp_type.replace('-', ' ')}</TableCell>
                      <TableCell>{reg.children.length}</TableCell>
                      <TableCell>KES {reg.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{getPaymentBadge(reg.payment_status)}</TableCell>
                      <TableCell className="capitalize text-xs">{reg.registration_type.replace('_', ' ')}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(reg.created_at!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(reg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRegistration && (
        <RegistrationDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          registration={selectedRegistration}
          onUpdate={loadRegistrations}
        />
      )}
    </>
  );
};