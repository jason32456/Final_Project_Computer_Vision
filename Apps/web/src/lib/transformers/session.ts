import type { Session, SessionAPIResponse } from "@/types/attendance";

export function transformSession(
  api: SessionAPIResponse
): Session {
  if (!api.schedules?.length) {
    throw new Error(`Session ${api.id} has no schedules`);
  }

  const schedule = api.schedules[0];
  const start = new Date(schedule.startTime);

  const WIB: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  };

  return {
    id: api.id,
    scheduleId: schedule.id,
    name: api.title,
    date: start,
    startTime: start.toLocaleTimeString("en-US", WIB),
    endTime: schedule.endTime
      ? new Date(schedule.endTime).toLocaleTimeString("en-US", WIB)
      : "18:00",
    students: [],
  };
}
