import { User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Student, AttendanceStatus } from "@/types/attendance";
import { format } from "date-fns";

interface StudentCardProps {
  student: Student;
}

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
};

export function StudentCard({ student }: StudentCardProps) {
  return (
    <Card className="flex w-full items-center justify-between gap-4 p-4 transition-all hover:shadow-md animate-fade-in">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground">{student.name}</h4>
        <p className="text-sm text-muted-foreground">{student.email || student.id}</p>
      </div>

      <div className="flex items-center gap-3">
        {student.checkInTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(student.checkInTime, "HH:mm")}</span>
          </div>
        )}
        <Badge variant={student.status}>{statusLabels[student.status]}</Badge>
      </div>
    </Card>
  );
}
