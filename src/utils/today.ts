import { toDateKey } from "./format";

/**
 * 今天的日期 'YYYY-MM-DD'。
 * 有設定環境變數 VITE_TODAY 就用它，讓驗收時可以固定「今天」。
 */
export function today(): string {
  const fixedToday = import.meta.env.VITE_TODAY;
  if (fixedToday) {
    return fixedToday;
  }
  return toDateKey(new Date());
}

/**
 * 現在的時間（ISO 字串），簽核歷程、送出時間用。
 * 日期換成 today()，時間用現在的時間，這樣固定「今天」時紀錄也會落在同一天。
 */
export function now(): string {
  const [year, month, day] = today().split("-").map(Number);
  const current = new Date();
  current.setFullYear(year, month - 1, day);
  return current.toISOString();
}
