/** Replaces `{{key}}` with string values; unknown keys stay as empty string. */
export function renderEmailPlaceholders(
  template: string,
  vars: Record<string, string | null | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, rawKey: string) => {
    const v = vars[rawKey]
    return v != null && String(v).length > 0 ? String(v) : ""
  })
}
