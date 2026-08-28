import {
  addDays,
  endOfWeek,
  format,
  isBefore,
  isToday,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";

export function todayISODate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toDate(value: string): Date {
  return parseISO(value);
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isBefore(toDate(dueDate), startOfDay(new Date())) && !isToday(toDate(dueDate));
}

export function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return isToday(toDate(dueDate));
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  const date = toDate(dueDate);
  if (isToday(date)) return "Heute";
  return format(date, "d. MMM", { locale: de });
}

export function formatWeekdayShort(date: Date): string {
  return format(date, "EEEEEE", { locale: de });
}

export function currentWeekDays(): Date[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekRangeLabel(): string {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return `${format(start, "d. MMM", { locale: de })} – ${format(end, "d. MMM", {
    locale: de,
  })}`;
}
