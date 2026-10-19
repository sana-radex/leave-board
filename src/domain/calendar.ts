import type { CalendarDay } from "../types/types";
import { addDays, getWeekday } from "./date";

/**
 * 是不是工作天
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
