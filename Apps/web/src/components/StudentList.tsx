import { Users } from "lucide-react";
import { StudentCard } from "@/components/StudentCard";
import type { Student } from "@/types/attendance";
import { format } from "date-fns";

interface StudentListProps {
  students: Student[];
  sessionName?: string;
  sessionStartTime?: Date;
}

export function StudentList({ students, sessionName, sessionStartTime}: StudentListProps) {
  console.log("StudentList received students:", students);
  
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No students found</h3>
        <p className="text-sm text-muted-foreground">
          Select a course and session to view students
        </p>
      </div>
    );
  }

  const stats = {
    present: students.filter((s) => s.status === "present").length,
    late: students.filter((s) => s.status === "late").length,
    absent: students.filter((s) => s.status === "absent").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {sessionName || "Student Attendance"}
          </h3>

          {/* ✅ FULL DATE */}
          {sessionStartTime && (
            <p className="text-sm text-muted-foreground">
              {format(sessionStartTime, "EEEE, MMMM d yyyy")}
            </p>
          )}

          <p className="text-sm text-muted-foreground">
            {students.length} students enrolled
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">{stats.present} Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">{stats.late} Late</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">{stats.absent} Absent</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {students.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </div>
  );
}
