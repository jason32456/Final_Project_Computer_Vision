import { apiFetch } from "@/lib/apiClient";
import { base64ToBlob } from "@/lib/image";

export async function processFaceRecognition(
  imageData: string,
  scheduleId: string
) {
  const formData = new FormData();
  formData.append("image", base64ToBlob(imageData), "face.jpg");
  formData.append("scheduleId", scheduleId);

  return apiFetch<{
    student: string;
    status: "PRESENT" | "LATE" | "ABSENT";
    timeDifference: string;
    message: string;
  }>("/attendance/mark", {
    method: "POST",
    body: formData,
  });
}
