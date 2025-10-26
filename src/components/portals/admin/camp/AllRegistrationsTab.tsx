import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, FileEdit } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { CampRegistration } from '@/types/campRegistration';
import { toast } from 'sonner';
import { RegistrationDetailsDialog } from './RegistrationDetailsDialog';

export const AllRegistrationsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<CampRegistration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;
      if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter;

      const data = await campRegistrationService.getAllRegistrations(filters);
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
  }, [campTypeFilter, paymentFilter]);

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Registrations</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
