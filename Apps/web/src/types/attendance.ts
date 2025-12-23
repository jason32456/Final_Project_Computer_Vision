export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface Student {
  id: string;
  name: string;
  studentId: string;
  email?: string;
  imageUrl?: string;
  status: AttendanceStatus;
  checkInTime?: Date;
}

export interface Session {
  id: string;
  scheduleId: string;
  name: string;
  date: Date;
  startTime: string;
  endTime: string;
  students: Student[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  sessions: Session[];
}

// API Response types
export interface TeacherInfo {
  name: string;
  email: string;
}

export interface CourseAPIResponse {
  id: string;
  code: string;
  title: string;
  description?: string;
  teacherId: string;
  teacher: TeacherInfo;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sessions: number;
    enrollments: number;
  };
  sessions?: Session[];
}

// Session API Response types
export interface SessionSchedule {
  id: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  room?: string;
}

export interface SessionAPIResponse {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  schedules: SessionSchedule[];
  createdAt?: string;
  updatedAt?: string;
}

// Student API Response types
export interface StudentAttendance {
  id: string;
  studentId: string;
  sessionId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAPIResponse {
  id: string;
  studentId: string;
  name: string;
  email: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  attendances?: StudentAttendance[];
}

export interface AttendanceConfig {
  lateThresholdMinutes: number; // 50 minutes
}

export interface AttendanceStudentAPIResponse {
  studentId: string;
  name: string;
  email: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  recordedAt: string | null;
}

export interface AttendanceByScheduleAPIResponse {
  scheduleId: string;
  sessionId: string;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  students: AttendanceStudentAPIResponse[];
}
