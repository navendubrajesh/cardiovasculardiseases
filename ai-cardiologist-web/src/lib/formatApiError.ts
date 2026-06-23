/** Normalize FastAPI error payloads for user-facing messages. */
export function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => {
        if (entry && typeof entry === 'object' && 'msg' in entry) {
          return String((entry as { msg: string }).msg);
        }
        return JSON.stringify(entry);
      })
      .join('; ');
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    return String((detail as { message: string }).message);
  }
  return fallback;
}
