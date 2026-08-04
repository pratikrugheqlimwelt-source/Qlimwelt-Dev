import type { SyncSchedule } from "./types";

export function nextSyncFromSchedule(schedule: SyncSchedule, from = new Date()): string | null {
  if (schedule === "manual" || schedule === "realtime") return null;
  const d = new Date(from);
  switch (schedule) {
    case "hourly":
      d.setHours(d.getHours() + 1);
      break;
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
  }
  return d.toISOString();
}

export function scheduleLabel(schedule: SyncSchedule): string {
  switch (schedule) {
    case "realtime":
      return "Real time";
    case "hourly":
      return "Every hour";
    case "daily":
      return "Every day";
    case "weekly":
      return "Every week";
    case "manual":
      return "Manual";
  }
}
