import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course, Session } from "@/types/attendance";

interface CourseSelectorProps {
  courses: Course[];
  selectedCourse: Course | null;
  selectedSession: Session | null;
  onCourseChange: (course: Course | null) => void;
  onSessionChange: (session: Session | null) => void;
  onOpenChange?: (open: boolean) => void;
  onSessionOpenChange?: (courseId: string) => void;
  onStudentChange?: (sessionId: string, scheduleId: string) => void;
  isLoadingCourses?: boolean;
  isLoadingSessions?: boolean;
}

export function CourseSelector({
  courses,
  selectedCourse,
  selectedSession,
  onCourseChange,
  onSessionChange,
  onOpenChange,
  onSessionOpenChange,
  onStudentChange,
  isLoadingCourses = false,
  isLoadingSessions = false,
}: CourseSelectorProps) {
  const handleCourseOpenChange = (open: boolean) => {
    onOpenChange?.(open);
  };

  const handleSessionOpenChange = (open: boolean) => {
    if (open && selectedCourse) {
      onSessionOpenChange?.(selectedCourse.id);
    }
  };

  const handleSessionChange = (value: string) => {
    console.log("handleSessionChange called with value:", value);
    const session = selectedCourse?.sessions.find((s) => s.id === value) || null;
    console.log("Found session:", session);
    onSessionChange(session);
    // Fetch students when a session is selected
    if (session) {
      console.log("Calling onStudentChange with sessionId:", session.id, "scheduleId:", session.scheduleId);
      onStudentChange?.(session.id, session.scheduleId);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Course
        </label>

        <Select
          value={selectedCourse?.id || ""}
          onOpenChange={handleCourseOpenChange}
          onValueChange={(value) => {
            const course = courses.find((c) => c.id === value) || null;
            onCourseChange(course);
            onSessionChange(null);
          }}
        >
          <SelectTrigger className="w-[280px] bg-card">
            <SelectValue
              placeholder={
                isLoadingCourses
                  ? "Loading courses..."
                  : "Select a course"
              }
            />
          </SelectTrigger>

          <SelectContent>
            {isLoadingCourses ? (
              <div className="p-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : courses.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No courses available
              </div>
            ) : (
              courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <span className="font-medium">{course.code}</span>
                  <span className="ml-2 text-muted-foreground">
                    - {course.name}
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* SESSION SELECT */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Session
        </label>

        <Select
          value={selectedSession?.id || ""}
          onOpenChange={handleSessionOpenChange}
          onValueChange={handleSessionChange}
          disabled={!selectedCourse}
        >
          <SelectTrigger className="w-[280px] bg-card">
            <SelectValue
              placeholder={
                !selectedCourse
                  ? "Select course first"
                  : isLoadingSessions
                  ? "Loading sessions..."
                  : "Select a session"
              }
            />
          </SelectTrigger>

          <SelectContent>
            {isLoadingSessions ? (
              <div className="p-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (selectedCourse?.sessions || []).length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">
                No sessions available
              </div>
            ) : (
              selectedCourse?.sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <span className="font-medium">{session.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({session.startTime} - {session.endTime})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
