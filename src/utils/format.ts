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

/** 取得時間選項：00:00–23:30，每 30 分鐘一格 */
export function getTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hh = String(hour).padStart(2, "0");
    options.push(`${hh}:00`, `${hh}:30`);
  }
  return options;
}
