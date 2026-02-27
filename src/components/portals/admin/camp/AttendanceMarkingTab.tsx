import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle, XCircle, Clock, QrCode, Calendar, Users, CalendarDays, Mail, Download, FileText } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { attendanceService } from '@/services/attendanceService';
import { qrCodeService } from '@/services/qrCodeService';
import { CampRegistration, CampChild } from '@/types/campRegistration';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { QRScannerDialog } from '@/components/attendance/QRScannerDialog';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface ExpectedChild {
  registration: CampRegistration;
  child: CampChild;
  session: string;
}

export const AttendanceMarkingTab: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, any>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sendEmailNotifications, setSendEmailNotifications] = useState(false);

  // Batch load attendance for all registrations on a date - eliminates N+1 queries
  const loadAttendanceBatch = useCallback(async (regs: CampRegistration[], date: string) => {
    if (regs.length === 0) return {};

    const regIds = regs.map(r => r.id).filter(Boolean) as string[];
    
    const { data, error } = await supabase
      .from('camp_attendance')
      .select('*')
      .in('registration_id', regIds)
      .eq('attendance_date', date);

    if (error) {
      console.error('Error batch loading attendance:', error);
      return {};
    }

    const statusMap: Record<string, any> = {};
    for (const record of (data || [])) {
      const key = `${record.registration_id}-${record.child_name}-${date}`;
      statusMap[key] = record;
    }
    return statusMap;
  }, []);

  const loadRegistrations = useCallback(async () => {
    try {
      if (!initialLoaded) setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;

      const allRegs = await campRegistrationService.getAllRegistrations(filters);
      const activeRegs = allRegs.filter(r => r.status === 'active');
      setRegistrations(activeRegs);

      // Batch load attendance instead of N+1 queries
      const statusMap = await loadAttendanceBatch(activeRegs, selectedDate);
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [campTypeFilter, selectedDate, initialLoaded, loadAttendanceBatch]);

  useEffect(() => {
    loadRegistrations();
  }, [campTypeFilter, selectedDate]);

  // Client-side filtering by child name or registration number
  const filteredExpectedChildren = useMemo((): ExpectedChild[] => {
    const expected: ExpectedChild[] = [];

    for (const reg of registrations) {
      for (const child of reg.children) {
        const selectedDates = child.selectedDates || [];
        if (selectedDates.includes(selectedDate)) {
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

    // Apply search filter client-side for instant results
    if (!searchTerm.trim()) return expected;

    const term = searchTerm.toLowerCase();
    return expected.filter(item =>
      item.child.childName.toLowerCase().includes(term) ||
      item.registration.parent_name.toLowerCase().includes(term) ||
      item.registration.registration_number?.toLowerCase().includes(term)
    );
  }, [registrations, selectedDate, searchTerm]);

  const paidExpected = filteredExpectedChildren.filter(e => e.registration.payment_status === 'paid');
  const unpaidExpected = filteredExpectedChildren.filter(e => e.registration.payment_status !== 'paid');

  // All expected (unfiltered) for stats
  const allExpected = useMemo((): ExpectedChild[] => {
    const expected: ExpectedChild[] = [];
    for (const reg of registrations) {
      for (const child of reg.children) {
        const selectedDates = child.selectedDates || [];
        if (selectedDates.includes(selectedDate)) {
          let session = 'full';
          if (child.selectedSessions && typeof child.selectedSessions === 'object' && !Array.isArray(child.selectedSessions)) {
            session = (child.selectedSessions as Record<string, 'half' | 'full'>)[selectedDate] || 'full';
          }
          expected.push({ registration: reg, child, session });
        }
      }
    }
    return expected;
  }, [registrations, selectedDate]);

  const totalExpected = allExpected.length;
  const totalPresent = allExpected.filter(item => {
    const key = `${item.registration.id}-${item.child.childName}-${selectedDate}`;
    const attendance = attendanceStatus[key];
    return attendance && !attendance.check_out_time;
  }).length;
  const paidExpectedCount = allExpected.filter(e => e.registration.payment_status === 'paid').length;
  const unpaidExpectedCount = allExpected.filter(e => e.registration.payment_status !== 'paid').length;

  const handleCheckIn = async (registrationId: string, childName: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }
    try {
      const key = `${registrationId}-${childName}-${selectedDate}`;
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: { id: 'temp', check_in_time: new Date().toISOString(), check_out_time: null }
      }));

      await attendanceService.checkInForDate(registrationId, childName, user.id, selectedDate, undefined, sendEmailNotifications);
      let message = `${childName} checked in successfully for ${format(parseISO(selectedDate), 'MMM d, yyyy')}`;
      if (sendEmailNotifications) message += ' (notification sent)';
      toast.success(message);

      const attendance = await attendanceService.hasCheckedInOnDate(registrationId, childName, selectedDate);
      setAttendanceStatus(prev => ({ ...prev, [key]: attendance }));
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
      const key = `${registrationId}-${childName}-${selectedDate}`;
      setAttendanceStatus(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCheckOut = async (attendanceId: string, childName: string, registrationId: string) => {
    try {
      const key = `${registrationId}-${childName}-${selectedDate}`;
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: { ...prev[key], check_out_time: new Date().toISOString() }
      }));

      await attendanceService.checkOut(attendanceId, undefined, sendEmailNotifications, registrationId, childName);
      let message = `${childName} checked out successfully`;
      if (sendEmailNotifications) message += ' (notification sent)';
      toast.success(message);

      const attendance = await attendanceService.hasCheckedInOnDate(registrationId, childName, selectedDate);
      setAttendanceStatus(prev => ({ ...prev, [key]: attendance }));
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out');
      loadRegistrations();
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
        toast.error('Invalid QR code.');
        return;
      }
      const registration = await campRegistrationService.getRegistrationByQRCode(qrCodeData);
      if (!registration) {
        toast.error('Registration not found');
        return;
      }

      let checkedInCount = 0, alreadyCheckedInCount = 0, notExpectedCount = 0;
      for (const child of registration.children) {
        if (!(child.selectedDates || []).includes(selectedDate)) { notExpectedCount++; continue; }
        const hasCheckedIn = await attendanceService.hasCheckedInOnDate(registration.id!, child.childName, selectedDate);
        if (!hasCheckedIn) {
          await attendanceService.checkInForDate(registration.id!, child.childName, user.id, selectedDate);
          checkedInCount++;
        } else { alreadyCheckedInCount++; }
      }
      setScannerOpen(false);

      if (checkedInCount > 0) {
        let message = `Checked in ${checkedInCount} child${checkedInCount !== 1 ? 'ren' : ''} from ${registration.registration_number}`;
        if (alreadyCheckedInCount > 0) message += ` (${alreadyCheckedInCount} already in)`;
        if (notExpectedCount > 0) message += ` (${notExpectedCount} not registered for today)`;
        toast.success(message);
        const statusUpdates: Record<string, any> = {};
        for (const child of registration.children) {
          const key = `${registration.id}-${child.childName}-${selectedDate}`;
          const attendance = await attendanceService.hasCheckedInOnDate(registration.id!, child.childName, selectedDate);
          statusUpdates[key] = attendance;
        }
        setAttendanceStatus(prev => ({ ...prev, ...statusUpdates }));
      } else if (alreadyCheckedInCount > 0) {
        toast.info('All expected children are already checked in');
      } else if (notExpectedCount > 0) {
        toast.warning('No children from this registration are expected today');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      toast.error('Failed to process QR code');
      setScannerOpen(false);
    }
  };

  // --- Export functions ---
  const exportCSV = useCallback(() => {
    const items = filteredExpectedChildren;
    if (items.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Reg #', 'Parent Name', 'Phone', 'Child Name', 'Age', 'Session', 'Payment', 'Status', 'Check-In Time', 'Check-Out Time'];
    const rows = items.map(item => {
      const key = `${item.registration.id}-${item.child.childName}-${selectedDate}`;
      const att = attendanceStatus[key];
      const status = att?.check_out_time ? 'Checked Out' : att ? 'Present' : 'Not Arrived';
      return [
        item.registration.registration_number || '',
        item.registration.parent_name,
        item.registration.phone ? item.registration.phone.slice(0, 4) + '****' + item.registration.phone.slice(-2) : '-',
        item.child.childName,
        item.child.ageRange,
        item.session === 'full' ? 'Full Day' : 'Half Day',
        item.registration.payment_status,
        status,
        att?.check_in_time ? new Date(att.check_in_time).toLocaleTimeString() : '',
        att?.check_out_time ? new Date(att.check_out_time).toLocaleTimeString() : ''
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  }, [filteredExpectedChildren, attendanceStatus, selectedDate]);

  const exportPDF = useCallback(async () => {
    const items = filteredExpectedChildren;
    if (items.length === 0) {
      toast.error('No data to export');
      return;
    }
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text(`Attendance - ${format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Expected: ${totalExpected} | Present: ${totalPresent} | Paid: ${paidExpectedCount} | Unpaid: ${unpaidExpectedCount}`, 14, 28);

      const tableData = items.map(item => {
        const key = `${item.registration.id}-${item.child.childName}-${selectedDate}`;
        const att = attendanceStatus[key];
        const status = att?.check_out_time ? 'Checked Out' : att ? 'Present' : 'Not Arrived';
        return [
          item.registration.registration_number || '',
          item.registration.parent_name,
          item.registration.phone ? item.registration.phone.slice(0, 4) + '****' + item.registration.phone.slice(-2) : '-',
          item.child.childName,
          item.child.ageRange,
          item.session === 'full' ? 'Full Day' : 'Half Day',
          item.registration.payment_status,
          status,
          att?.check_in_time ? new Date(att.check_in_time).toLocaleTimeString() : '',
          att?.check_out_time ? new Date(att.check_out_time).toLocaleTimeString() : ''
        ];
      });

      autoTable(doc, {
        head: [['Reg #', 'Parent', 'Phone', 'Child', 'Age', 'Session', 'Payment', 'Status', 'In', 'Out']],
        body: tableData,
        startY: 34,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 87, 55] },
      });

      doc.save(`attendance-${selectedDate}.pdf`);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to generate PDF');
    }
  }, [filteredExpectedChildren, attendanceStatus, selectedDate, totalExpected, totalPresent, paidExpectedCount, unpaidExpectedCount]);

  const formatChildDates = (child: CampChild): string => {
    const dates = child.selectedDates || [];
    if (dates.length === 0) return 'No dates selected';
    if (dates.length <= 3) return dates.map(d => format(parseISO(d), 'MMM d')).join(', ');
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
              <Badge variant="outline">{presentCount}/{items.length} Present</Badge>
              <Badge variant={isPaid ? 'default' : 'secondary'}>{items.length} Expected</Badge>
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
                          <div className="text-xs text-muted-foreground">{item.registration.phone ? item.registration.phone.slice(0, 4) + '****' + item.registration.phone.slice(-2) : '-'}</div>
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
                          <Button size="sm" onClick={() => handleCheckIn(item.registration.id!, item.child.childName)}>
                            Check In
                          </Button>
                        ) : !checkedOut ? (
                          <Button size="sm" variant="outline" onClick={() => handleCheckOut(attendance.id, item.child.childName, item.registration.id!)}>
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
            <div className="text-3xl font-bold">{paidExpectedCount}</div>
            <div className="text-sm text-muted-foreground">Paid Expected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-destructive">{unpaidExpectedCount}</div>
            <div className="text-sm text-muted-foreground">Unpaid Expected</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance for {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={exportCSV} title="Download CSV">
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportPDF} title="Download PDF">
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
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
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                  Today
                </Button>
              )}
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by child name, parent, or reg number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={() => setScannerOpen(true)} variant="secondary" className="flex items-center gap-2">
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
          <div className="flex items-center gap-3 mt-4 p-3 bg-muted/50 rounded-lg">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Switch id="email-notifications" checked={sendEmailNotifications} onCheckedChange={setSendEmailNotifications} />
              <Label htmlFor="email-notifications" className="text-sm cursor-pointer">
                Send email notifications to parents on check-in/check-out
              </Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      <QRScannerDialog open={scannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={handleQRScan} />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading attendance data...</div>
      ) : (
        <>
          {renderExpectedSection(paidExpected, 'Paid - Expected Children', true)}
          {renderExpectedSection(unpaidExpected, 'Unpaid - Expected Children', false)}
        </>
      )}
    </div>
  );
};
