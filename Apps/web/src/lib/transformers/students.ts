import type {
  Student,
  StudentAPIResponse,
  AttendanceStudentAPIResponse,
  AttendanceStatus,
} from "@/types/attendance";

export function transformStudent(
  api: StudentAPIResponse,
  sessionId?: string
): Student {
  const attendance = sessionId
    ? api.attendances?.find(a => a.sessionId === sessionId)
    : undefined;

  return {
    id: api.id,
    name: api.name,
    studentId: api.studentId,
    email: api.email,
    imageUrl: api.imageUrl,
    status: attendance?.status,
    checkInTime: attendance?.checkInTime
      ? new Date(attendance.checkInTime)
      : undefined,
  };
}

export function transformAttendanceStudent(
  api: AttendanceStudentAPIResponse
): Student {
  return {
    id: api.studentId,
    name: api.name,
    studentId: api.studentId,
    email: api.email,
    imageUrl: undefined,
    status: api.status.toLowerCase() as AttendanceStatus,
    checkInTime: api.recordedAt
      ? new Date(api.recordedAt)
      : undefined,
  };
}
