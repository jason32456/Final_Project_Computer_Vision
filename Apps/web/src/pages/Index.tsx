import { useState } from "react";
import { ScanFace, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CourseSelector } from "@/components/CourseSelector";
import { StudentList } from "@/components/StudentList";
import { CameraScanner } from "@/components/CameraScanner";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";
import { processFaceRecognition } from "@/lib/api";
import type { AttendanceStatus } from "@/types/attendance";
import { format } from "date-fns";

export default function Index() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { toast } = useToast();

  const {
    courses,
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
  } = useAttendance();

  console.log("=== INDEX RENDER ===");
  console.log("selectedCourse:", selectedCourse);
  console.log("selectedSession:", selectedSession);
  console.log("students in session:", selectedSession?.students);

  // Check if the schedule has started
  const isScheduleStarted = (): boolean => {
    if (!selectedSession) return false;
    
    const now = new Date();
    const sessionDate = new Date(selectedSession.date);
    const [hours, minutes] = selectedSession.startTime.split(":").map(Number);
    
    // Create a date object with the session date and start time
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(hours, minutes, 0, 0);
    
    console.log("Current time:", now);
    console.log("Session start time:", sessionStart);
    
    return now >= sessionStart;
  };

  const handleScan = async (imageData: string) => {
    if (!selectedSession) {
      toast({
        title: "No session selected",
        description: "Please select a course and session first.",
        variant: "destructive",
      });
      return;
    }

    if (!isScheduleStarted()) {
      const [hours, minutes] = selectedSession.startTime.split(":").map(Number);
      const sessionStart = format(
        new Date(selectedSession.date).setHours(hours, minutes, 0, 0),
        "PPP p"
      );
      
      toast({
        title: "Schedule Not Started",
        description: `This session starts at ${sessionStart}. Scanning is not yet available.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setScanResult(null);

    try {
      console.log("Starting face recognition with scheduleId:", selectedSession.scheduleId);
      const result = await processFaceRecognition(imageData, selectedSession.scheduleId);

      console.log("Face recognition result:", result);

      // Find student by name (case-insensitive)
      const student = selectedSession.students.find(
        (s) => s.name.toLowerCase() === result.studentName.toLowerCase()
      );

      console.log("Matched student:", student);

      if (student) {
        // Use the hook's updateStudentStatus function for proper state management
        const statusMap: Record<string, AttendanceStatus> = {
          "PRESENT": "present",
          "LATE": "late",
          "ABSENT": "absent",
        };
        
        const mappedStatus: AttendanceStatus = statusMap[result.status];
        updateStudentStatus(student.id, mappedStatus, new Date());
        
        console.log("Student status updated via hook");
      } else {
        console.warn("Student not found in list. Available names:", selectedSession.students.map(s => s.name));
      }

      setScanResult({
        success: true,
        message: `✓ ${result.studentName} - ${result.status} (${result.timeDifference})`,
      });

      toast({
        title: "Attendance Recorded",
        description: `${result.studentName} marked as ${result.status}`,
      });
    } catch (error) {
      console.error("Face recognition error:", error);
      setScanResult({
        success: false,
        message: error instanceof Error ? error.message : "Face not recognized. Please try again.",
      });

      toast({
        title: "Recognition Failed",
        description: error instanceof Error ? error.message : "Could not recognize face",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const canScan = selectedCourse && selectedSession && isScheduleStarted();
  const scheduleNotStartedMessage = selectedSession && !isScheduleStarted() 
    ? (() => {
        const [hours, minutes] = selectedSession.startTime.split(":").map(Number);
        const sessionStart = format(
          new Date(selectedSession.date).setHours(hours, minutes, 0, 0),
          "PPP p"
        );
        return `Session starts at ${sessionStart}`;
      })()
    : undefined;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Attendance Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>

            <Button
              variant="scan"
              size="lg"
              onClick={() => setScannerOpen(true)}
              disabled={!canScan}
              className="gap-2"
            >
              <ScanFace className="h-5 w-5" />
              Scan Face
            </Button>
          </header>

          <div className="p-6 space-y-6">
            {/* Course & Session Selection */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Course & Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseSelector
                  courses={courses}
                  selectedCourse={selectedCourse}
                  selectedSession={selectedSession}
                  onCourseChange={setSelectedCourse}
                  onSessionChange={setSelectedSession}
                  onOpenChange={fetchCourseData}
                  onSessionOpenChange={fetchSessionData}
                  onStudentChange={(sessionId, scheduleId) => {
                    console.log("Index.tsx onStudentChange called - sessionId:", sessionId, "scheduleId:", scheduleId);
                    fetchStudentData(sessionId, scheduleId);
                  }}
                  isLoadingCourses={isLoadingCourses}
                  isLoadingSessions={isLoadingSessions}
                />

                {!selectedCourse || !selectedSession ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Select a course and session to enable face scanning and view
                    students.
                  </p>
                ) : scheduleNotStartedMessage ? (
                  <p className="mt-4 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
                    ⏰ {scheduleNotStartedMessage}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {/* Student List */}
            <Card>
              <CardContent className="pt-6">
                <StudentList
                  students={selectedSession?.students || []}
                  sessionName={
                    selectedSession
                      ? `${selectedCourse?.code} - ${selectedSession.name}`
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </div>
        </main>

        <CameraScanner
          open={scannerOpen}
          onClose={() => {
            setScannerOpen(false);
            setScanResult(null);
          }}
          onScan={handleScan}
          isProcessing={isProcessing}
          scanResult={scanResult}
        />
      </div>
    </SidebarProvider>
  );
}
