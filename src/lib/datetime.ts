/**
 * Small helpers for moving between HTML date/time input values
 * (always local time, no timezone info) and the ISO timestamps
 * stored in Supabase (`follow_up_at`).
 */

export function isoToDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

export function isoToTimeInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toTimeString().slice(0, 5); // HH:MM in local time
}

export function combineDateTimeToISO(
  dateValue: string,
  timeValue: string
): string | null {
  if (!dateValue) return null;
  const time = timeValue || "09:00";
  const local = new Date(`${dateValue}T${time}:00`);
  return local.toISOString();
}

export function isOverdue(followUpAt: string | null): boolean {
  if (!followUpAt) return false;
  return new Date(followUpAt).getTime() < Date.now();
}

export function isToday(followUpAt: string | null): boolean {
  if (!followUpAt) return false;
  const today = new Date().toLocaleDateString("en-CA");
  return new Date(followUpAt).toLocaleDateString("en-CA") === today;
}

export function formatFollowUp(followUpAt: string | null): string {
  if (!followUpAt) return "—";
  const d = new Date(followUpAt);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function startOfCurrentMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}
