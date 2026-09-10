import {
  addDays,
  endOfWeek,
  format,
  getISODay,
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

/**
 * A task without a due date is meant to be tackled the day it's created —
 * from the next day onward it counts as overdue until done. `createdAt` is
 * the task's created_at timestamp; pass it whenever due_date is null.
 */
export function isOverdue(dueDate: string | null, createdAt?: string | null): boolean {
  if (dueDate) {
    return isBefore(toDate(dueDate), startOfDay(new Date())) && !isToday(toDate(dueDate));
  }
  if (!createdAt) return false;
  return !isToday(new Date(createdAt));
}

export function isDueToday(dueDate: string | null, createdAt?: string | null): boolean {
  if (dueDate) return isToday(toDate(dueDate));
  if (!createdAt) return false;
  return isToday(new Date(createdAt));
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

/** ISO weekday of a date: 1 = Monday .. 7 = Sunday. */
export function isoWeekday(date: Date): number {
  return getISODay(date);
}

/** Options for a weekday picker, Monday first, value = ISO weekday (1-7). */
export const WEEKDAY_OPTIONS: { value: number; label: string }[] = currentWeekDays().map(
  (date, i) => ({ value: i + 1, label: formatWeekdayShort(date) })
);

/**
 * Whether a routine with the given weekday set applies on `date`. An empty
 * array means "every day".
 */
export function routineAppliesOn(weekdays: number[], date: Date = new Date()): boolean {
  return weekdays.length === 0 || weekdays.includes(isoWeekday(date));
}
