import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, Clock, QrCode, Calendar, Users, CalendarDays } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { attendanceService } from '@/services/attendanceService';
import { qrCodeService } from '@/services/qrCodeService';
import { CampRegistration, CampChild } from '@/types/campRegistration';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { QRScannerDialog } from '@/components/attendance/QRScannerDialog';
import { format, parseISO, isToday } from 'date-fns';

interface ExpectedChild {
  registration: CampRegistration;
  child: CampChild;
  session: string; // 'half' or 'full'
}

export const AttendanceMarkingTab: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, any>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'expected' | 'all'>('expected');

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;

      const allRegs = await campRegistrationService.getAllRegistrations(filters);
      
      // Filter for active registrations
      const activeRegs = allRegs.filter(r => r.status === 'active');
      setRegistrations(activeRegs);

      // Check attendance status for all children for selected date
      const statusMap: Record<string, any> = {};
      for (const reg of activeRegs) {
        for (const child of reg.children) {
          const key = `${reg.id}-${child.childName}-${selectedDate}`;
          const attendance = await attendanceService.hasCheckedInOnDate(reg.id!, child.childName, selectedDate);
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
    loadRegistrations();
  }, [campTypeFilter, selectedDate]);

  // Get children expected on the selected date
  const expectedChildren = useMemo((): ExpectedChild[] => {
    const expected: ExpectedChild[] = [];
    
    for (const reg of registrations) {
      for (const child of reg.children) {
        // Check if this child is registered for the selected date
        const selectedDates = child.selectedDates || [];
        
        if (selectedDates.includes(selectedDate)) {
          // Determine session type for this date
          let session = 'full';
          if (child.selectedSessions) {
            if (typeof child.selectedSessions === 'object' && !Array.isArray(child.selectedSessions)) {
              session = (child.selectedSessions as Record<string, 'half' | 'full'>)[selectedDate] || 'full';
            }
          }
          
          expected.push({ registration: reg, child, session });
        }
      }
    }
    
    return expected;
  }, [registrations, selectedDate]);

  // Separate expected children by payment status
  const paidExpected = expectedChildren.filter(e => e.registration.payment_status === 'paid');
  const unpaidExpected = expectedChildren.filter(e => e.registration.payment_status !== 'paid');

  const handleCheckIn = async (registrationId: string, childName: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const key = `${registrationId}-${childName}-${selectedDate}`;
      
      // Optimistically update UI
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: {
          id: 'temp',
          check_in_time: new Date().toISOString(),
          check_out_time: null
        }
      }));

      // Perform check-in for selected date
      await attendanceService.checkInForDate(registrationId, childName, user.id, selectedDate);
      toast.success(`${childName} checked in successfully for ${format(parseISO(selectedDate), 'MMM d, yyyy')}`);
      
      // Fetch updated attendance record
      const attendance = await attendanceService.hasCheckedInOnDate(registrationId, childName, selectedDate);
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: attendance
      }));
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
      loadRegistrations();
    }
  };

  const handleCheckOut = async (attendanceId: string, childName: string, registrationId: string) => {
    try {
      const key = `${registrationId}-${childName}-${selectedDate}`;
      
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
      
      // Fetch updated attendance record
      const attendance = await attendanceService.hasCheckedInOnDate(registrationId, childName, selectedDate);
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: attendance
      }));
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out');
      loadRegistrations();
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadRegistrations();
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
      const parsed = qrCodeService.parseQRCodeData(qrCodeData);
      
      if (!parsed || parsed.type !== 'camp_registration') {
        toast.error('Invalid QR code. Please scan a valid registration QR code.');
        return;
      }

      const registration = await campRegistrationService.getRegistrationByQRCode(qrCodeData);
      
      if (!registration) {
        toast.error('Registration not found');
        return;
      }

      // Check in all children who are expected today and haven't checked in yet
      let checkedInCount = 0;
      let alreadyCheckedInCount = 0;
      let notExpectedCount = 0;

      for (const child of registration.children) {
        const selectedDates = child.selectedDates || [];
        
        if (!selectedDates.includes(selectedDate)) {
          notExpectedCount++;
          continue;
        }

        const hasCheckedIn = await attendanceService.hasCheckedInOnDate(registration.id!, child.childName, selectedDate);
        
        if (!hasCheckedIn) {
          await attendanceService.checkInForDate(registration.id!, child.childName, user.id, selectedDate);
          checkedInCount++;
        } else {
          alreadyCheckedInCount++;
        }
      }

      setScannerOpen(false);

      if (checkedInCount > 0) {
        let message = `Checked in ${checkedInCount} child${checkedInCount !== 1 ? 'ren' : ''} from ${registration.registration_number}`;
        if (alreadyCheckedInCount > 0) message += ` (${alreadyCheckedInCount} already in)`;
        if (notExpectedCount > 0) message += ` (${notExpectedCount} not registered for today)`;
        toast.success(message);
        
        // Update attendance status
        const statusUpdates: Record<string, any> = {};
        for (const child of registration.children) {
          const key = `${registration.id}-${child.childName}-${selectedDate}`;
          const attendance = await attendanceService.hasCheckedInOnDate(registration.id!, child.childName, selectedDate);
          statusUpdates[key] = attendance;
        }
        setAttendanceStatus(prev => ({ ...prev, ...statusUpdates }));
      } else if (alreadyCheckedInCount > 0) {
        toast.info('All expected children from this registration are already checked in');
      } else if (notExpectedCount > 0) {
        toast.warning('No children from this registration are expected today');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      toast.error('Failed to process QR code');
      setScannerOpen(false);
    }
  };

  const formatChildDates = (child: CampChild): string => {
    const dates = child.selectedDates || [];
    if (dates.length === 0) return 'No dates selected';
    if (dates.length <= 3) {
      return dates.map(d => format(parseISO(d), 'MMM d')).join(', ');
    }
    return `${dates.length} days`;
  };

  const renderExpectedSection = (items: ExpectedChild[], title: string, isPaid: boolean) => {
    const presentCount = items.filter(item => {
      const key = `${item.registration.id}-${item.child.childName}-${selectedDate}`;
      return attendanceStatus[key] && !attendanceStatus[key].check_out_time;
    }).length;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {presentCount}/{items.length} Present
              </Badge>
              <Badge variant={isPaid ? 'default' : 'secondary'}>
                {items.length} Expected
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {title.toLowerCase()} for {format(parseISO(selectedDate), 'MMMM d, yyyy')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg #</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Registered Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const key = `${item.registration.id}-${item.child.childName}-${selectedDate}`;
                  const attendance = attendanceStatus[key];
                  const checkedIn = !!attendance;
                  const checkedOut = attendance?.check_out_time;

                  return (
                    <TableRow key={`${key}-${idx}`}>
                      <TableCell className="font-mono text-xs">{item.registration.registration_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.registration.parent_name}</div>
                          <div className="text-xs text-muted-foreground">{item.registration.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.child.childName}</TableCell>
                      <TableCell>{item.child.ageRange}</TableCell>
                      <TableCell>
                        <Badge variant={item.session === 'full' ? 'default' : 'outline'}>
                          {item.session === 'full' ? 'Full Day' : 'Half Day'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          <span title={item.child.selectedDates?.join(', ')}>
                            {formatChildDates(item.child)}
                          </span>
                        </div>
                      </TableCell>
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
                            <XCircle className="h-3 w-3" /> Not Arrived
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {attendance && (
                          <div className="space-y-1 text-xs">
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
                            onClick={() => handleCheckIn(item.registration.id!, item.child.childName)}
                          >
                            Check In
                          </Button>
                        ) : !checkedOut ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(attendance.id, item.child.childName, item.registration.id!)}
                          >
                            Check Out
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  };

  const totalExpected = expectedChildren.length;
  const totalPresent = expectedChildren.filter(item => {
    const key = `${item.registration.id}-${item.child.childName}-${selectedDate}`;
    const attendance = attendanceStatus[key];
    return attendance && !attendance.check_out_time;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary">{totalExpected}</div>
            <div className="text-sm text-muted-foreground">Expected Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{totalPresent}</div>
            <div className="text-sm text-muted-foreground">Present Now</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{paidExpected.length}</div>
            <div className="text-sm text-muted-foreground">Paid Expected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-destructive">{unpaidExpected.length}</div>
            <div className="text-sm text-muted-foreground">Unpaid Expected</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance for {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
          </CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
              />
              {selectedDate !== new Date().toISOString().split('T')[0] && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </Button>
              )}
            </div>
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
                Scan QR
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
          {renderExpectedSection(paidExpected, 'Paid - Expected Children', true)}
          {renderExpectedSection(unpaidExpected, 'Unpaid - Expected Children', false)}
        </>
      )}
    </div>
  );
};
