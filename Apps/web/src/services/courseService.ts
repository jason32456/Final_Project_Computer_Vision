import { apiFetch } from "@/lib/apiClient";
import { transformCourse } from "@/lib/transformers/course";
import type { Course, CourseAPIResponse } from "@/types/attendance";

export async function fetchCourses(): Promise<Course[]> {
  const data = await apiFetch<CourseAPIResponse[]>("/courses");
  return data.map(transformCourse);
}

export async function fetchCourseById(
  courseId: string
): Promise<Course> {
  const data = await apiFetch<CourseAPIResponse>(
    `/courses/${courseId}`
  );
  return transformCourse(data);
}
