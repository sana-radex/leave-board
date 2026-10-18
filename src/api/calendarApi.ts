import { calendarDayList } from "../data/mockData";
import type { CalendarDay } from "../types/types";
import { TABLES, readTable, delay } from "./db";

/** 取得辦公日曆 */
export async function getCalendarDayList(): Promise<CalendarDay[]> {
  await delay();
  return readTable(TABLES.calendarDayList, calendarDayList);
}
