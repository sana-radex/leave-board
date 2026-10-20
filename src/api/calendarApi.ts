import type { CalendarDay } from "../types/domain";
import * as calendarDayRepository from "../repositories/calendarDayRepository";
import { delay } from "./delay";

/** 取得辦公日曆 */
export async function getCalendarDayList(): Promise<CalendarDay[]> {
  await delay();
  return calendarDayRepository.findAll();
}
