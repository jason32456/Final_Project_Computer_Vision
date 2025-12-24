import { useState, useCallback } from "react";
import type { Course, Session, Student, AttendanceStatus } from "@/types/attendance";
import { fetchCourses } from "@/services/courseService";
import { fetchSessionsByCourseId } from "@/services/sessionService";
import { fetchAttendanceByScheduleId } from "@/services/studentService";

const LATE_THRESHOLD_MINUTES = 50;

export function useAttendance() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const updateStudentStatus = useCallback(
    (studentId: string, status: AttendanceStatus, checkInTime?: Date) => {
      console.log("updateStudentStatus called for studentId:", studentId, "status:", status);
      
      // Only update the selected session, don't touch the courses array
      if (selectedSession) {
        setSelectedSession((prev) =>
          prev
            ? {
                ...prev,
                students: prev.students.map((student) =>
                  student.id === studentId
                    ? { ...student, status, checkInTime }
                    : student
                ),
              }
            : null
        );
        console.log("Selected session updated");
      }
    },
    [selectedSession]
  );

  const determineStatus = useCallback(
    (scanTime: Date): AttendanceStatus => {

      const [startHour, startMinute] = selectedSession.startTime.split(":").map(Number);
      const [endHour, endMinute] = selectedSession.endTime.split(":").map(Number);

      const sessionStart = new Date(scanTime);
      sessionStart.setHours(startHour, startMinute, 0, 0);

      const sessionEnd = new Date(scanTime);
      sessionEnd.setHours(endHour, endMinute, 0, 0);

      const lateThreshold = new Date(sessionStart);
      lateThreshold.setMinutes(lateThreshold.getMinutes() + LATE_THRESHOLD_MINUTES);

      if (scanTime > sessionEnd) {
        return "absent";
      } else if (scanTime > lateThreshold) {
        return "late";
      }
      return "present";
    },
    [selectedSession]
  );

  const processAttendance = useCallback(
    (studentId: string): { status: AttendanceStatus; message: string } => {
      const scanTime = new Date();
      const status = determineStatus(scanTime);

      updateStudentStatus(studentId, status, scanTime);

      const messages: Record<AttendanceStatus, string> = {
        present: "Marked as Present",
        late: "Marked as Late (50+ minutes after start)",
        absent: "Marked as Absent (after session end)",
      };

      return { status, message: messages[status] };
    },
    [determineStatus, updateStudentStatus]
  );

  const setCourseData = useCallback((data: Course[]) => {
    setCourses(data);
  }, []);

  const fetchCourseData = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  const fetchSessionData = useCallback(async (courseId: string) => {
    setIsLoadingSessions(true);
    try {
      const sessions = await fetchSessionsByCourseId(courseId);
      // Update the selected course with fetched sessions
      setSelectedCourse((prevCourse) =>
        prevCourse && prevCourse.id === courseId
          ? { ...prevCourse, sessions }
          : prevCourse
      );
    } catch (error) {
      console.error("Error fetching session data:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const fetchStudentData = useCallback(async (sessionId: string, scheduleId?: string) => {
    setIsLoadingStudents(true);
    console.log("fetchStudentData called with sessionId:", sessionId, "scheduleId:", scheduleId);
    
    try {
      // Determine which scheduleId to use
      let actualScheduleId = scheduleId;
      
      // If scheduleId not provided, try to get from selectedSession
      // But be careful - selectedSession might be the old one due to closure
      if (!actualScheduleId && selectedSession?.id === sessionId) {
        actualScheduleId = selectedSession.scheduleId;
      }
      
      if (!actualScheduleId) {
        console.error("No scheduleId provided and cannot get from session");
        setIsLoadingStudents(false);
        return;
      }

      console.log("Fetching attendance for scheduleId:", actualScheduleId);
      const attendanceData = await fetchAttendanceByScheduleId(actualScheduleId);
      console.log("Fetched attendance data from database:", attendanceData);
      
      // Update ONLY the selected session with the fetched students
      setSelectedSession((prevSession) => {
        if (!prevSession || prevSession.id !== sessionId) {
          console.log("Session mismatch during update - prevSession.id:", prevSession?.id, "sessionId:", sessionId);
          return prevSession;
        }
        
        console.log("Updating selected session with fresh students from database");
        return { ...prevSession, students: attendanceData.students };
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedSession]);

  return {
    courses,
    setCourseData,
    selectedCourse,
    setSelectedCourse,
    selectedSession,
    setSelectedSession,
    updateStudentStatus,
    processAttendance,
    fetchCourseData,
    isLoadingCourses,
    fetchSessionData,
    isLoadingSessions,
    fetchStudentData,
    isLoadingStudents,
  };
}
