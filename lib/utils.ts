// ── CareerOS Shared Utilities ─────────────────────────────────────

/**
 * Formats a date string (YYYY-MM-DD or ISO) into "8 Jun 2026" format.
 * Falls back to the raw string if parsing fails.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    // Parse as local date to avoid UTC offset shifting the day
    const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}
