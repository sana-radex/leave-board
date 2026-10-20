import type { CalendarDay } from "../types/domain";
import * as calendarDayRepository from "../repositories/calendarDayRepository";

export function getCalendarDays(): CalendarDay[] {
  return calendarDayRepository.findAll();
}
