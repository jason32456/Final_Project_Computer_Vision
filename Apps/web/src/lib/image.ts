export function base64ToBlob(
  base64: string,
  type = "image/jpeg"
): Blob {
  const raw = atob(base64.split(",")[1]);
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
  return new Blob([bytes], { type });
}
