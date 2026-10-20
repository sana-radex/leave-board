import type { CalendarDay } from "../types/domain";
import * as calendarService from "../services/calendarService";
import { delay } from "./delay";

/** 取得辦公日曆 */
export async function getCalendarDayList(): Promise<CalendarDay[]> {
  await delay();
  return calendarService.getCalendarDays();
}
