import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentList } from "@/components/StudentList";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { fetchAttendanceByScheduleId } from "@/lib/api";
import type { Student } from "@/types/attendance";
import { format, parseISO } from "date-fns";

interface SessionDetailsProps {
  scheduleId: string;
}

interface SessionAttendanceData {
  scheduleId: string;
  sessionId: string;
  sessionTitle: string;
  startTime: string;
  endTime: string;
  students: Student[];
}

export function SessionDetails({ scheduleId }: SessionDetailsProps) {
  const [sessionData, setSessionData] = useState<SessionAttendanceData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessionData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAttendanceByScheduleId(scheduleId);
        setSessionData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load session details"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionData();
  }, [scheduleId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!sessionData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No session data available</AlertDescription>
      </Alert>
    );
  }

  const startDateTime = parseISO(sessionData.startTime);
  const endDateTime = parseISO(sessionData.endTime);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">{sessionData.sessionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(startDateTime, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {format(startDateTime, "HH:mm")} - {format(endDateTime, "HH:mm")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <StudentList
        students={sessionData.students}
        sessionName={sessionData.sessionTitle}
      />
    </div>
  );
}
