import { addMinutes, isAfter, isBefore, getDay, parseISO, format, startOfDay, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface BusinessHoursEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  timezone: string;
}

function parseTime(date: Date, timeStr: string, tz: string): Date {
  const dateStr = format(toZonedTime(date, tz), 'yyyy-MM-dd');
  return fromZonedTime(parseISO(`${dateStr}T${timeStr}:00`), tz);
}

export function calculateSlaDeadline(
  startTime: Date,
  durationMinutes: number,
  businessHoursOnly: boolean,
  schedule: BusinessHoursEntry[],
): Date {
  if (!businessHoursOnly || schedule.length === 0) {
    return addMinutes(startTime, durationMinutes);
  }

  const tz = schedule[0]?.timezone ?? 'UTC';
  let current = new Date(startTime);
  let remaining = durationMinutes;
  let safety = 0;

  while (remaining > 0 && safety < 365) {
    safety++;
    const dow = getDay(toZonedTime(current, tz));
    const entry = schedule.find((e) => e.dayOfWeek === dow && e.isActive);

    if (!entry) {
      current = fromZonedTime(
        startOfDay(addDays(toZonedTime(current, tz), 1)),
        tz,
      );
      continue;
    }

    const dayStart = parseTime(current, entry.startTime, tz);
    const dayEnd = parseTime(current, entry.endTime, tz);

    if (isAfter(dayStart, current)) {
      current = dayStart;
    }

    if (!isBefore(current, dayEnd)) {
      current = fromZonedTime(
        startOfDay(addDays(toZonedTime(current, tz), 1)),
        tz,
      );
      continue;
    }

    const availableMinutes = (dayEnd.getTime() - current.getTime()) / 60000;

    if (remaining <= availableMinutes) {
      return addMinutes(current, remaining);
    }

    remaining -= availableMinutes;
    current = fromZonedTime(
      startOfDay(addDays(toZonedTime(current, tz), 1)),
      tz,
    );
  }

  return current;
}

export function isSlaWarning(
  now: Date,
  due: Date,
  totalMinutes: number,
  threshold: number,
): boolean {
  const elapsed = (now.getTime() - (due.getTime() - totalMinutes * 60000)) / 60000;
  return elapsed / totalMinutes >= threshold && now < due;
}
