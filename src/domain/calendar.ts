import type { CalendarDay } from "../types/types";
import { addDays, getWeekday } from "./date";

/**
 * 是不是工作天（CAL-03、TIME-05）
 * - 補班日：上班
 * - 國定假日、補假：放假
 * - 週六、週日：放假
 * - 其他：上班
 */
export function isWorkday(date: string, calendarDays: CalendarDay[]): boolean {
  const specialDay = calendarDays.find((day) => day.date === date);
  if (specialDay) {
    return specialDay.type === "makeup_workday";
  }
  const weekday = getWeekday(date);
  return weekday !== 0 && weekday !== 6;
}

/** 起訖之間（含頭尾）的工作天 */
export function getWorkdays(
  startDate: string,
  endDate: string,
  calendarDays: CalendarDay[],
): string[] {
  const workdays: string[] = [];
  for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
    if (isWorkday(date, calendarDays)) {
      workdays.push(date);
    }
  }
  return workdays;
}

/**
 * 從隔天起算的第 n 個工作天（RETRO-01 補請期限）
 * 例如 10/16（五）往後 5 個工作天：10/19、20、21、22、23 → 10/23
 */
export function addWorkdays(
  date: string,
  n: number,
  calendarDays: CalendarDay[],
): string {
  let current = date;
  let count = 0;
  while (count < n) {
    current = addDays(current, 1);
    if (isWorkday(current, calendarDays)) {
      count++;
    }
  }
  return current;
}
