import { SessionDetails } from "@/components/SessionDetails";
import { fetchAttendanceByScheduleId } from "@/lib/api";
import { useState, useEffect } from "react";
import type { Student } from "@/types/attendance";

/**
 * USAGE EXAMPLES - Different ways to use the attendance display system
 */

// ============================================================================
// EXAMPLE 1: Simplest - Just drop the component in
// ============================================================================
export function Example1_SimpleComponent() {
  return <SessionDetails scheduleId="sched-2" />;
}

// ============================================================================
// EXAMPLE 2: Get schedule ID from URL parameter
// ============================================================================
import { useSearchParams } from "react-router-dom";

export function Example2_URLParams() {
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get("scheduleId") || "sched-2";

  return <SessionDetails scheduleId={scheduleId} />;
}

// ============================================================================
// EXAMPLE 3: Manual API call with custom processing
// ============================================================================
export function Example3_ManualAPICall() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAttendanceByScheduleId("sched-2");
        
        // You can process students here before displaying
        const processedStudents = data.students.map(student => ({
          ...student,
          // Add custom properties if needed
        }));
        
        setStudents(processedStudents);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Attendance for Session</h2>
      <p>Total students: {students.length}</p>
      <ul>
        {students.map(student => (
          <li key={student.id}>
            {student.name} - {student.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Filter students by status
// ============================================================================
export function Example4_FilterByStatus() {
  const [status, setStatus] = useState<"present" | "absent" | "late">("absent");

  return (
    <div>
      <button onClick={() => setStatus("absent")}>Show Absent</button>
      <button onClick={() => setStatus("present")}>Show Present</button>
      <button onClick={() => setStatus("late")}>Show Late</button>

      <SessionDetailsFiltered scheduleId="sched-2" filterStatus={status} />
    </div>
  );
}

function SessionDetailsFiltered({
  scheduleId,
  filterStatus,
}: {
  scheduleId: string;
  filterStatus: string;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAttendanceByScheduleId(scheduleId).then(result => {
      const filtered = {
        ...result,
        students: result.students.filter(s => s.status === filterStatus),
      };
      setData(filtered);
    });
  }, [scheduleId, filterStatus]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h3>
        {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Students
      </h3>
      <p>{data.students.length} students</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Multiple schedules in tabs
// ============================================================================
export function Example5_TabbedView() {
  const [activeTab, setActiveTab] = useState<string>("sched-1");
  const schedules = ["sched-1", "sched-2", "sched-3"];

  return (
    <div>
      <div className="tabs">
        {schedules.map(scheduleId => (
          <button
            key={scheduleId}
            onClick={() => setActiveTab(scheduleId)}
            className={activeTab === scheduleId ? "active" : ""}
          >
            {scheduleId}
          </button>
        ))}
      </div>

      <SessionDetails scheduleId={activeTab} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Dashboard with statistics
// ============================================================================
export function Example6_Dashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAttendanceByScheduleId("sched-2").then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  const stats = {
    total: data.students.length,
    present: data.students.filter((s: Student) => s.status === "present").length,
    absent: data.students.filter((s: Student) => s.status === "absent").length,
    late: data.students.filter((s: Student) => s.status === "late").length,
    attendanceRate: Math.round(
      ((data.students.filter((s: Student) => s.status === "present").length /
        data.students.length) *
        100)
    ),
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Students</h4>
          <p className="big-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h4>Present</h4>
          <p className="big-number" style={{ color: "green" }}>
            {stats.present}
          </p>
        </div>
        <div className="stat-card">
          <h4>Absent</h4>
          <p className="big-number" style={{ color: "red" }}>
            {stats.absent}
          </p>
        </div>
        <div className="stat-card">
          <h4>Late</h4>
          <p className="big-number" style={{ color: "orange" }}>
            {stats.late}
          </p>
        </div>
        <div className="stat-card">
          <h4>Attendance Rate</h4>
          <p className="big-number">{stats.attendanceRate}%</p>
        </div>
      </div>

      <SessionDetails scheduleId="sched-2" />
    </div>
  );
}

// ============================================================================
// EXAMPLE 7: Export attendance data
// ============================================================================
export function Example7_ExportData() {
  const handleExport = async () => {
    const data = await fetchAttendanceByScheduleId("sched-2");

    // Convert to CSV
    const csv = [
      ["Name", "Student ID", "Email", "Status", "Check-in Time"],
      ...data.students.map(s => [
        s.name,
        s.studentId,
        s.id,
        s.status,
        s.checkInTime ? s.checkInTime.toISOString() : "-",
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${data.sessionTitle}.csv`;
    a.click();
  };

  return (
    <div>
      <button onClick={handleExport}>Export to CSV</button>
      <SessionDetails scheduleId="sched-2" />
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Real-time polling (auto-refresh)
// ============================================================================
export function Example8_AutoRefresh() {
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  return (
    <div>
      <div>
        <label>
          Refresh interval (ms):
          <input
            type="number"
            value={refreshInterval}
            onChange={e => setRefreshInterval(Number(e.target.value))}
          />
        </label>
      </div>

      <AutoRefreshingSessionDetails
        scheduleId="sched-2"
        refreshInterval={refreshInterval}
      />
    </div>
  );
}

function AutoRefreshingSessionDetails({
  scheduleId,
  refreshInterval,
}: {
  scheduleId: string;
  refreshInterval: number;
}) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const newData = await fetchAttendanceByScheduleId(scheduleId);
      setData(newData);
    };

    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [scheduleId, refreshInterval]);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <p style={{ fontSize: "0.8em", color: "gray" }}>
        Last updated: {new Date().toLocaleTimeString()}
      </p>
      <SessionDetails scheduleId={scheduleId} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Using with React Query (recommended for production)
// ============================================================================
// Install: npm install @tanstack/react-query
import { useQuery } from "@tanstack/react-query";

export function Example9_ReactQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["attendance", "sched-2"],
    queryFn: () => fetchAttendanceByScheduleId("sched-2"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  if (!data) return <div>No data</div>;

  return <SessionDetails scheduleId="sched-2" />;
}

// ============================================================================
// EXAMPLE 10: Error boundary wrapper
// ============================================================================
import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", border: "1px solid red" }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function Example10_WithErrorBoundary() {
  return (
    <ErrorBoundary>
      <SessionDetails scheduleId="sched-2" />
    </ErrorBoundary>
  );
}
