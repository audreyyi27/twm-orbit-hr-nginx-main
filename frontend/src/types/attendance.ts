// Type definitions based on your database schema
export type AttendanceStatus = "clocked_in" | "clocked_out" | "partial";

export interface Attendance {
  id: string;
  user_id: string;
  attendance_date: string;
  clock_in_time: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_in_address: string | null;
  clock_out_time: string | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  clock_out_address: string | null;
  work_description: string | null;
  activity: string | null;
  reason: string | null;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  attendance_id: string;
  event_type: string;
  event_time: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  description: string | null;
  activity: string | null;
}

export interface AttendanceTeam {
  id: string;
  user_id: string;
  attendance_date: string;
  clock_in_time: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_in_address: string | null;
  clock_out_time: string | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  clock_out_address: string | null;
  work_description: string | null;
  activity: string | null;
  reason: string | null;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  fullname: string;
  employee_id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  positions: string;
  role: string;
}