import type { Course, CourseAPIResponse } from "@/types/attendance";

export function transformCourse(
  api: CourseAPIResponse
): Course {
  return {
    id: api.id,
    code: api.code,
    name: api.title,
    instructor: api.teacher?.name ?? "-",
    sessions: api.sessions ?? [],
  };
}
