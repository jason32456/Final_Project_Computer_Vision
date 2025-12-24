import { apiFetch } from "@/lib/apiClient";
import { transformSession } from "@/lib/transformers/session";
import type { Session, SessionAPIResponse } from "@/types/attendance";

export async function fetchSessionsByCourseId(
  courseId: string
): Promise<Session[]> {
  const data = await apiFetch<SessionAPIResponse[]>(
    `/courses/${courseId}/sessions`
  );
  return data.map(transformSession);
}

export async function fetchSessionById(
  sessionId: string
): Promise<Session> {
  const data = await apiFetch<SessionAPIResponse>(
    `/sessions/${sessionId}`
  );
  return transformSession(data);
}
