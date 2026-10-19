/**
 * 日期工具：日期一律用 'YYYY-MM-DD' 字串、時間用 'HH:mm' 字串。
 * 內部用 Date.UTC 計算，不受電腦時區影響，不會差一天。
 */

/** 把 'YYYY-MM-DD' 拆成年、月（1–12）、日 */
function parseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/** 年、月（1–12）、日組成 'YYYY-MM-DD' */
function formatDate(year: number, month: number, day: number): string {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 某年某月（1–12）有幾天 */
export function getDaysInMonth(year: number, month: number): number {
  // 下個月的第 0 天 = 這個月的最後一天
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 是不是閏年 */
export function isLeapYear(year: number): boolean {
  return getDaysInMonth(year, 2) === 29;
}

/** 加減天數，例如 addDays('2026-12-31', 1) → '2027-01-01' */
export function addDays(date: string, days: number): string {
  const { year, month, day } = parseDate(date);
  // 日超過或小於當月範圍時，Date 會自動換月、換年
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return formatDate(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    result.getUTCDate(),
  );
}

/**
 * 加減月份；對應日期不存在時取該月最後一天。
 * 例如 addMonths('2020-08-31', 6) → '2021-02-28'
 */
export function addMonths(date: string, months: number): string {
  const { year, month, day } = parseDate(date);
  // 先換算成「從西元 0 年 1 月起第幾個月」，加完再換回年、月
  const totalMonths = year * 12 + (month - 1) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = totalMonths - newYear * 12 + 1;
  const lastDay = getDaysInMonth(newYear, newMonth);
  return formatDate(newYear, newMonth, Math.min(day, lastDay));
}

/** 星期幾：0 = 星期日、1 = 星期一 … 6 = 星期六 */
export function getWeekday(date: string): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** 'HH:mm' 轉成從 0:00 起算的分鐘數，例如 '13:30' → 810 */
export function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/** 分鐘數轉成 'HH:mm'，例如 810 → '13:30' */
export function fromMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
