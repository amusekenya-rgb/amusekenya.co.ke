export interface CampChild {
  childName: string;
  dateOfBirth: string;
  ageRange: string;
  specialNeeds?: string;
  selectedDays: string[];
  selectedSessions: string[];
  price: number;
}

export interface CampRegistration {
  id?: string;
  registration_number?: string;
  camp_type: 'easter' | 'summer' | 'end-year' | 'mid-term-1' | 'mid-term-2' | 'mid-term-3' | 'mid-term-october' | 'mid-term-feb-march' | 'day-camps' | 'little-forest';
  parent_name: string;
  email: string;
  phone: string;
  emergency_contact?: string;
  children: CampChild[];
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'partial';
  payment_method: 'pending' | 'card' | 'mpesa' | 'cash_ground';
  payment_reference?: string;
  registration_type: 'online_only' | 'online_paid' | 'ground_registration';
  qr_code_data: string;
  consent_given: boolean;
  status: 'active' | 'cancelled' | 'completed';
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  admin_notes?: string;
}

export interface CampAttendance {
  id?: string;
  registration_id: string;
  child_name: string;
  check_in_time: string;
  check_out_time?: string;
  attendance_date: string;
  marked_by?: string;
  notes?: string;
  created_at?: string;
}

export interface AttendanceRecord extends CampAttendance {
  registration_number?: string;
  parent_name?: string;
  payment_status?: string;
}

export interface CampRegistrationWithAttendance extends CampRegistration {
  attendance_records?: CampAttendance[];
}
