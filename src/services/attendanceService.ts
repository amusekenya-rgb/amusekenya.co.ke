import { supabase } from '@/integrations/supabase/client';
import { CampAttendance, AttendanceRecord } from '@/types/campRegistration';

export const attendanceService = {
  async checkIn(registrationId: string, childName: string, markedBy: string, notes?: string) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .insert({
        registration_id: registrationId,
        child_name: childName,
        check_in_time: new Date().toISOString(),
        attendance_date: new Date().toISOString().split('T')[0],
        marked_by: markedBy,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data as CampAttendance;
  },

  async checkOut(attendanceId: string, notes?: string) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .update({
        check_out_time: new Date().toISOString(),
        notes,
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;
    return data as CampAttendance;
  },

  async getAttendanceByDate(date: string, campType?: string) {
    let query = supabase
      .from('camp_attendance')
      .select(`
        *,
        camp_registrations!inner(
          registration_number,
          parent_name,
          payment_status,
          camp_type
        )
      `)
      .eq('attendance_date', date);

    if (campType) {
      query = query.eq('camp_registrations.camp_type', campType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getTodaysAttendance(campType?: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceByDate(today, campType);
  },

  async getAttendanceByRegistration(registrationId: string) {
    const { data, error } = await supabase
      .from('camp_attendance')
      .select('*')
      .eq('registration_id', registrationId)
      .order('attendance_date', { ascending: false });

    if (error) throw error;
    return data as CampAttendance[];
  },

  async getAttendanceSummary(campType?: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('camp_attendance')
      .select(`
        attendance_date,
        camp_registrations!inner(camp_type, payment_status)
      `);

    if (campType) {
      query = query.eq('camp_registrations.camp_type', campType);
    }
    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }
    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async hasCheckedInToday(registrationId: string, childName: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('camp_attendance')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('child_name', childName)
      .eq('attendance_date', today)
      .maybeSingle();

    if (error) throw error;
    return data as CampAttendance | null;
  },
};
