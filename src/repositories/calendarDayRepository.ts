import { calendarDayList } from "../data/calendarDays";
import type { CalendarDay } from "../types/domain";
import { TABLES, readTable } from "./db";

export function findAll(): CalendarDay[] {
  return readTable(TABLES.calendarDayList, calendarDayList);
}
