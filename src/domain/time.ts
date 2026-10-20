import type { CalendarDay, LeaveDay, LeaveUnit, Shift } from "../types/domain";
import { toMinutes, fromMinutes } from "./date";
import { getWorkdays } from "./calendar";

/** 時間選項：班別可選時間範圍內，每 30 分鐘一格 */
export function getTimeOptions(shift: Shift): string[] {
  const options: string[] = [];
  const start = toMinutes(shift.selectableStart);
  const end = toMinutes(shift.selectableEnd);
  for (let minutes = start; minutes <= end; minutes += 30) {
    options.push(fromMinutes(minutes));
  }
  return options;
}

/**
 * 單日時數
 * 結束 − 開始 − 與休息時間重疊的部分，上限為每日工時，不足 0 以 0 計
 */
export function calcDayHours(
  startTime: string,
  endTime: string,
  shift: Shift,
): number {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const breakStart = toMinutes(shift.breakStart);
  const breakEnd = toMinutes(shift.breakEnd);

  const overlap = Math.max(
    0,
    Math.min(end, breakEnd) - Math.max(start, breakStart),
  );
  const hours = (end - start - overlap) / 60;

  if (hours < 0) {
    return 0;
  }
  return Math.min(hours, shift.dailyHours);
}

/** 切分每日明細需要的資料 */
interface SplitLeaveDaysInput {
  /** 請假單位 */
  unit: LeaveUnit;
  /** 起始日期 */
  startDate: string;
  /** 起始時間；天制不用 */
  startTime: string | null;
  /** 結束日期 */
  endDate: string;
  /** 結束時間；天制不用 */
  endTime: string | null;
  /** 申請人的班別 */
  shift: Shift;
  /** 辦公日曆 */
  calendarDays: CalendarDay[];
}

/**
 * 把請假起訖切成每日明細，只留工作天
 * - 天制：每個工作天都是整天區間
 * - 0.5 小時制：第一天「起始時間～整天區間結束」，最後一天「整天區間開始～結束時間」，中間整天
 * - 算出來 0 小時的天不記
 */
export function splitLeaveDays(input: SplitLeaveDaysInput): LeaveDay[] {
  const { unit, startDate, startTime, endDate, endTime, shift, calendarDays } =
    input;
  const days: LeaveDay[] = [];

  for (const date of getWorkdays(startDate, endDate, calendarDays)) {
    let dayStart = shift.fullDayStart;
    let dayEnd = shift.fullDayEnd;
    if (unit === "half_hour") {
      if (date === startDate && startTime) {
        dayStart = startTime;
      }
      if (date === endDate && endTime) {
        dayEnd = endTime;
      }
    }

    const hours = calcDayHours(dayStart, dayEnd, shift);
    if (hours > 0) {
      days.push({ date, startTime: dayStart, endTime: dayEnd, hours });
    }
  }
  return days;
}

/** 每日明細的時數加總 */
export function sumHours(days: LeaveDay[]): number {
  return days.reduce((total, day) => total + day.hours, 0);
}
