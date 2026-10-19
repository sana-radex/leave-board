import type { LeaveUnit } from "../types/types";

/** 轉換時間格式，台灣當地顯示方式 */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/**
 * 把 Date 轉成 'YYYY-MM-DD'，用本地時間。
 * 不用 toISOString()，因為它是 UTC 時間，台灣（+8 小時）的半夜會變成前一天。
 */
export function toDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 'YYYY-MM-DD' → '2026/3/1' */
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}/${month}/${day}`;
}

/** 'HH:mm' → '9:00'（小時前面不補 0） */
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":");
  return `${Number(hour)}:${minute}`;
}

/**
 * 假單起訖，例如：
 * - 同一天：2026/10/20 9:00–12:00
 * - 跨日：2026/10/28 14:00 – 2026/10/29 12:00
 * - 天制：2026/11/2 – 2026/11/3（只顯示日期）
 */
export function formatLeaveRange(
  startTime: string,
  endTime: string,
  unit: LeaveUnit | null,
): string {
  const [startDate, startClock] = startTime.split("T");
  const [endDate, endClock] = endTime.split("T");

  if (unit === "day") {
    if (startDate === endDate) {
      return formatDate(startDate);
    }
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  }

  if (startDate === endDate) {
    return `${formatDate(startDate)} ${formatTime(startClock)}–${formatTime(endClock)}`;
  }
  return `${formatDate(startDate)} ${formatTime(startClock)} – ${formatDate(endDate)} ${formatTime(endClock)}`;
}

/** 時數顯示成「天＋小時」，1 天 = 8 小時，例如 20 → '2 天 4 小時' */
export function formatHours(hours: number): string {
  const days = Math.floor(hours / 8);
  const restHours = hours - days * 8;
  if (days === 0) {
    return `${restHours} 小時`;
  }
  if (restHours === 0) {
    return `${days} 天`;
  }
  return `${days} 天 ${restHours} 小時`;
}
