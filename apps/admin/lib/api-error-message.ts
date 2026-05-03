/**
 * API JSON errors are shaped as `{ code, message }` (see `lib/errors.ts`).
 * Toast and other UI must not receive plain objects as React text children.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback
  if (typeof error === "string") return error
  if (typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === "string" && msg.length > 0) return msg
  }
  return fallback
}
