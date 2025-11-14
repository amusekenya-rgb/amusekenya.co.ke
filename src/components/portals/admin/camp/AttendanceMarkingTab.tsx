import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, Clock, QrCode } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { attendanceService } from '@/services/attendanceService';
import { qrCodeService } from '@/services/qrCodeService';
import { CampRegistration } from '@/types/campRegistration';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { QRScannerDialog } from '@/components/attendance/QRScannerDialog';

export const AttendanceMarkingTab: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, any>>({});
  const [scannerOpen, setScannerOpen] = useState(false);

  const loadTodaysRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;

      const allRegs = await campRegistrationService.getAllRegistrations(filters);
      
      // Filter for active registrations
      const activeRegs = allRegs.filter(r => r.status === 'active');
      setRegistrations(activeRegs);

      // Check attendance status for all children
      const statusMap: Record<string, any> = {};
      for (const reg of activeRegs) {
        for (const child of reg.children) {
          const key = `${reg.id}-${child.childName}`;
          const attendance = await attendanceService.hasCheckedInToday(reg.id!, child.childName);
          statusMap[key] = attendance;
        }
      }
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaysRegistrations();
  }, [campTypeFilter]);

  const handleCheckIn = async (registrationId: string, childName: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const key = `${registrationId}-${childName}`;
      
      // Optimistically update UI
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: {
          id: 'temp',
          check_in_time: new Date().toISOString(),
          check_out_time: null
        }
      }));

      // Perform check-in
      await attendanceService.checkIn(registrationId, childName, user.id);
      toast.success(`${childName} checked in successfully`);
      
      // Fetch only the updated attendance record
      const attendance = await attendanceService.hasCheckedInToday(registrationId, childName);
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: attendance
      }));
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
      // Reload on error to ensure correct state
      loadTodaysRegistrations();
    }
  };

  const handleCheckOut = async (attendanceId: string, childName: string, registrationId: string) => {
    try {
      const key = `${registrationId}-${childName}`;
      
      // Optimistically update UI
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          check_out_time: new Date().toISOString()
        }
      }));

      // Perform check-out
      await attendanceService.checkOut(attendanceId);
      toast.success(`${childName} checked out successfully`);
      
      // Fetch only the updated attendance record
      const attendance = await attendanceService.hasCheckedInToday(registrationId, childName);
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: attendance
      }));
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out');
      // Reload on error to ensure correct state
      loadTodaysRegistrations();
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadTodaysRegistrations();
      return;
    }

    try {
      setLoading(true);
      const results = await campRegistrationService.searchRegistrations(searchTerm);
      setRegistrations(results.filter(r => r.status === 'active'));
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCodeData: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    try {
      // Parse the QR code data
      const parsed = qrCodeService.parseQRCodeData(qrCodeData);
      
      if (!parsed || parsed.type !== 'camp_registration') {
        toast.error('Invalid QR code. Please scan a valid registration QR code.');
        return;
      }

      // Fetch the registration
      const registration = await campRegistrationService.getRegistrationByQRCode(qrCodeData);
      
      if (!registration) {
        toast.error('Registration not found');
        return;
      }

      // Check in all children who haven't checked in yet
      let checkedInCount = 0;
      let alreadyCheckedInCount = 0;

      for (const child of registration.children) {
        const hasCheckedIn = await attendanceService.hasCheckedInToday(registration.id!, child.childName);
        
        if (!hasCheckedIn) {
          await attendanceService.checkIn(registration.id!, child.childName, user.id);
          checkedInCount++;
        } else {
          alreadyCheckedInCount++;
        }
      }

      // Close scanner
      setScannerOpen(false);

      // Show success message
      if (checkedInCount > 0) {
        toast.success(
          `Successfully checked in ${checkedInCount} child${checkedInCount !== 1 ? 'ren' : ''} from ${registration.registration_number}${
            alreadyCheckedInCount > 0 ? ` (${alreadyCheckedInCount} already checked in)` : ''
          }`
        );
        
        // Update attendance status for affected children without full reload
        const statusUpdates: Record<string, any> = {};
        for (const child of registration.children) {
          const key = `${registration.id}-${child.childName}`;
          const attendance = await attendanceService.hasCheckedInToday(registration.id!, child.childName);
          statusUpdates[key] = attendance;
        }
        setAttendanceStatus(prev => ({ ...prev, ...statusUpdates }));
      } else if (alreadyCheckedInCount > 0) {
        toast.info('All children from this registration are already checked in');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      toast.error('Failed to process QR code. Please try again or check in manually.');
      setScannerOpen(false);
    }
  };

  const paidRegistrations = registrations.filter(r => r.payment_status === 'paid');
  const unpaidRegistrations = registrations.filter(r => r.payment_status !== 'paid');

  const renderAttendanceSection = (regs: CampRegistration[], title: string, isPaid: boolean) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant={isPaid ? 'default' : 'secondary'}>
            {regs.length} Registration{regs.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {regs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {title.toLowerCase()} found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg #</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Child Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regs.flatMap(reg =>
                reg.children.map(child => {
                  const key = `${reg.id}-${child.childName}`;
                  const attendance = attendanceStatus[key];
                  const checkedIn = !!attendance;
                  const checkedOut = attendance?.check_out_time;

                  return (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">{reg.registration_number}</TableCell>
                      <TableCell>{reg.parent_name}</TableCell>
                      <TableCell className="font-medium">{child.childName}</TableCell>
                      <TableCell>{child.ageRange}</TableCell>
                      <TableCell>
                        {checkedOut ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" /> Checked Out
                          </Badge>
                        ) : checkedIn ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" /> Present
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" /> Absent
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {attendance && (
                          <div className="space-y-1">
                            <div>In: {new Date(attendance.check_in_time).toLocaleTimeString()}</div>
                            {attendance.check_out_time && (
                              <div>Out: {new Date(attendance.check_out_time).toLocaleTimeString()}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {!checkedIn ? (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(reg.id!, child.childName)}
                          >
                            Check In
                          </Button>
                        ) : !checkedOut ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(attendance.id, child.childName, reg.id!)}
                          >
                            Check Out
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance - {new Date().toLocaleDateString()}</CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by registration number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => setScannerOpen(true)}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Scan QR Code
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
                <SelectItem value="little-forest">Little Forest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <QRScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {renderAttendanceSection(paidRegistrations, 'Paid Registrations', true)}
          {renderAttendanceSection(unpaidRegistrations, 'Unpaid Registrations', false)}
        </>
      )}
    </div>
  );
};
