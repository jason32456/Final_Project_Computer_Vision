import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionDetails } from "@/components/SessionDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search } from "lucide-react";

/**
 * Example page demonstrating how to fetch and display
 * student attendance details from a specific session
 */
export default function SessionAttendancePage() {
  const [scheduleId, setScheduleId] = useState("sched-2");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!scheduleId.trim()) {
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Session Attendance
          </h1>
          <p className="text-muted-foreground">
            Search for a session schedule to view student attendance details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter schedule ID (e.g., sched-2)"
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Example: Try using "sched-2" as the schedule ID
            </p>
          </CardContent>
        </Card>

        {isSearching ? (
          <SessionDetails scheduleId={scheduleId} />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Enter a schedule ID and click search to view attendance details
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
