import { apiFetch } from "@/lib/apiClient";
import {
  transformStudent,
  transformAttendanceStudent,
} from "../lib/transformers/students";
import type {
  Student,
  StudentAPIResponse,
  AttendanceStudentAPIResponse,
} from "@/types/attendance";

export async function fetchStudentsByCourseId(
  courseId: string,
  sessionId?: string
): Promise<Student[]> {
  const data = await apiFetch<StudentAPIResponse[]>(
    `/courses/${courseId}/students`
  );
  return data.map(s => transformStudent(s, sessionId));
}

export async function fetchStudentsBySessionId(
  sessionId: string
): Promise<Student[]> {
  const data = await apiFetch<StudentAPIResponse[]>(
    `/sessions/${sessionId}/students`
  );
  return data.map(s => transformStudent(s, sessionId));
}

export async function fetchAttendanceByScheduleId(
  scheduleId: string
) {
  const data = await apiFetch<{
    scheduleId: string;
    sessionId: string;
    sessionTitle: string;
    startTime: string;
    endTime: string;
    students: AttendanceStudentAPIResponse[];
  }>(`/attendance/schedule/${scheduleId}`);

  return {
    ...data,
    students: data.students.map(transformAttendanceStudent),
  };
}
