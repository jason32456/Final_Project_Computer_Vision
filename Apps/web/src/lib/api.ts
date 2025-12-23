import type {
  Course,
  CourseAPIResponse,
  Session,
  SessionAPIResponse,
  Student,
  StudentAPIResponse,
  AttendanceStudentAPIResponse,
  AttendanceStatus,
} from "@/types/attendance";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* =======================
   TRANSFORMERS
======================= */

/**
 * Transform API Course -> Internal Course
 */
function transformCourseData(apiCourse: CourseAPIResponse): Course {
  return {
    id: apiCourse.id,
    code: apiCourse.code,
    name: apiCourse.title,
    instructor: apiCourse.teacher?.name ?? "-",
    sessions: apiCourse.sessions ?? [],
  };
}

/**
 * Transform API Student -> Internal Student
 */
function transformStudentData(
  apiStudent: StudentAPIResponse,
  sessionId?: string
): Student {
  const sessionAttendance = sessionId
    ? apiStudent.attendances?.find(
        (a) => a.sessionId === sessionId
      )
    : undefined;

  return {
    id: apiStudent.id,
    name: apiStudent.name,
    studentId: apiStudent.studentId,
    email: apiStudent.email,
    imageUrl: apiStudent.imageUrl,
    status: sessionAttendance?.status,
    checkInTime: sessionAttendance?.checkInTime
      ? new Date(sessionAttendance.checkInTime)
      : undefined,
  };
}

/**
 * Transform API Session -> Internal Session
 */
function transformSessionData(apiSession: SessionAPIResponse): Session {
  if (!apiSession.schedules || apiSession.schedules.length === 0) {
    throw new Error(`Session ${apiSession.id} has no schedules`);
  }

  const primarySchedule = apiSession.schedules[0];
  const startDateTime = new Date(primarySchedule.startTime);

  const WIB_OPTIONS: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  };

  return {
    id: apiSession.id,
    scheduleId: primarySchedule.id,
    name: apiSession.title,
    date: startDateTime,
    startTime: startDateTime.toLocaleTimeString("en-US", WIB_OPTIONS),
    endTime: primarySchedule.endTime
      ? new Date(primarySchedule.endTime).toLocaleTimeString(
          "en-US",
          WIB_OPTIONS
        )
      : "18:00",
    students: [],
  };
}

/* =======================
   API CALLS
======================= */

/**
 * Fetch all courses
 */
export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE_URL}/courses`);
  if (!res.ok) throw new Error(res.statusText);

  const data: CourseAPIResponse[] = await res.json();
  return data.map(transformCourseData);
}

/**
 * Fetch course by ID
 */
export async function fetchCourseById(courseId: string): Promise<Course> {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}`);
  if (!res.ok) throw new Error(res.statusText);

  const data: CourseAPIResponse = await res.json();
  return transformCourseData(data);
}

/**
 * Fetch sessions by course ID
 */
export async function fetchSessionsByCourseId(
  courseId: string
): Promise<Session[]> {
  const res = await fetch(
    `${API_BASE_URL}/courses/${courseId}/sessions`
  );
  if (!res.ok) throw new Error(res.statusText);

  const data: SessionAPIResponse[] = await res.json();
  return data.map(transformSessionData);
}

/**
 * Fetch session by ID
 */
export async function fetchSessionById(
  sessionId: string
): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
  if (!res.ok) throw new Error(res.statusText);

  const data: SessionAPIResponse = await res.json();
  return transformSessionData(data);
}

/**
 * Fetch students by course ID
 */
export async function fetchStudentsByCourseId(
  courseId: string,
  sessionId?: string
): Promise<Student[]> {
  const res = await fetch(
    `${API_BASE_URL}/courses/${courseId}/students`
  );
  if (!res.ok) throw new Error(res.statusText);

  const data: StudentAPIResponse[] = await res.json();
  return data.map((s) => transformStudentData(s, sessionId));
}

/**
 * Fetch students by session ID
 */
export async function fetchStudentsBySessionId(
  sessionId: string
): Promise<Student[]> {
  console.log("fetchStudentsBySessionId called with:", sessionId);
  const res = await fetch(
    `${API_BASE_URL}/sessions/${sessionId}/students`
  );
  console.log("API Response status:", res.status);
  if (!res.ok) throw new Error(res.statusText);

  const data: StudentAPIResponse[] = await res.json();
  console.log("Raw API response:", data);
  const transformed = data.map((s) => transformStudentData(s, sessionId));
  console.log("Transformed students:", transformed);
  return transformed;
}

/**
 * Fetch student by ID
 */
export async function fetchStudentById(
  studentId: string,
  sessionId?: string
): Promise<Student> {
  const res = await fetch(
    `${API_BASE_URL}/students/${studentId}`
  );
  if (!res.ok) throw new Error(res.statusText);

  const data: StudentAPIResponse = await res.json();
  return transformStudentData(data, sessionId);
}

function transformStudentFromScheduleAttendance(
  apiStudent: AttendanceStudentAPIResponse
): Student {
  return {
    id: apiStudent.studentId,
    name: apiStudent.name,
    studentId: apiStudent.studentId,
    email: apiStudent.email,
    imageUrl: undefined,
    status: apiStudent.status.toLowerCase() as AttendanceStatus,
    checkInTime: apiStudent.recordedAt
      ? new Date(apiStudent.recordedAt)
      : undefined,
  };
}

/**
 * Fetch attendance details by schedule ID
 * Returns session info with student attendance records
 */
export async function fetchAttendanceByScheduleId(
  scheduleId: string
): Promise<{
  scheduleId: string;
  sessionId: string;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  students: Student[];
}> {
  console.log("fetchAttendanceByScheduleId called with:", scheduleId);
  const res = await fetch(
    `${API_BASE_URL}/attendance/schedule/${scheduleId}`
  );
  console.log("API Response status:", res.status);
  if (!res.ok) throw new Error(res.statusText);

  const data = (await res.json()) as {
    scheduleId: string;
    sessionId: string;
    sessionTitle: string;
    startTime: string;
    endTime: string;
    students: AttendanceStudentAPIResponse[];
  };

  console.log("Raw API response:", data);

  const result = {
    scheduleId: data.scheduleId,
    sessionId: data.sessionId,
    sessionTitle: data.sessionTitle,
    startTime: data.startTime,
    endTime: data.endTime,
    students: data.students.map(transformStudentFromScheduleAttendance),
  };

  console.log("Transformed attendance data:", result);

  return result;
}

/**
 * Process face recognition and record attendance
 */
export async function processFaceRecognition(
  imageData: string,
  scheduleId: string
): Promise<{
  success: boolean;
  studentName: string;
  status: "PRESENT" | "LATE" | "ABSENT";
  timeDifference: string;
  message: string;
}> {
  console.log("processFaceRecognition called with scheduleId:", scheduleId);

  // Convert base64 to blob
  const base64Data = imageData.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/jpeg" });

  // Create form data
  const formData = new FormData();
  formData.append("image", blob, "face.jpg");
  formData.append("scheduleId", scheduleId);

  const res = await fetch(`${API_BASE_URL}/attendance/mark`, {
    method: "POST",
    body: formData,
  });

  console.log("Face recognition API response status:", res.status);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Face recognition error:", errorData);
    throw new Error(
      errorData.message || errorData.error || "Face recognition failed"
    );
  }

  const data = await res.json();
  console.log("Face recognition result:", data);

  return {
    success: true,
    studentName: data.student || data.studentName || "Unknown",
    status: data.status || "PRESENT",
    timeDifference: data.timeDifference || "Unknown",
    message: data.message || "Attendance recorded successfully",
  };
}
