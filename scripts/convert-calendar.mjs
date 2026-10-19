/**
 * 一次性轉檔：政府資料開放平台「中華民國政府行政機關辦公日曆表」CSV → src/data/calendarDays.ts
 *
 * 用法：node scripts/convert-calendar.mjs
 *
 * CSV 放在 scripts/data/calendar-{西元年}.csv（UTF-8），欄位：西元日期,星期,是否放假,備註
 * - 是否放假：2 = 放假、0 = 上班
 * 只留下要特別標示的日子：
 * - 放假且有名稱（國定假日、補假；落在週末的也留著，行事曆要顯示名稱）
 * - 平日放假（萬一沒有名稱，名稱寫「放假」）
 * - 週末上班（補班日）
 * 一般的週六、週日不留，程式會自己判斷。
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = "scripts/data";
const OUTPUT_FILE = "src/data/calendarDays.ts";

const days = [];

const csvFiles = readdirSync(DATA_DIR)
  .filter((name) => /^calendar-\d{4}\.csv$/.test(name))
  .sort();

for (const fileName of csvFiles) {
  const text = readFileSync(join(DATA_DIR, fileName), "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).slice(1); // 第一行是標題

  for (const line of lines) {
    if (!line.trim()) continue;
    const [rawDate, weekday, isOff, note = ""] = line.split(",");
    const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const isWeekend = weekday === "六" || weekday === "日";
    const name = note.trim();

    if (isOff === "2" && (name || !isWeekend)) {
      days.push({ date, type: "holiday", name: name || "放假" });
    } else if (isOff === "0" && isWeekend) {
      days.push({ date, type: "makeup_workday", name: name || "補行上班" });
    }
  }
}

const rows = days
  .map((day) => `  { date: "${day.date}", type: "${day.type}", name: "${day.name}" },`)
  .join("\n");

const output = `import type { CalendarDay } from "../types/types";

/**
 * 辦公日曆：國定假日、補假、補班日
 * 由 scripts/convert-calendar.mjs 從政府資料開放平台「中華民國政府行政機關辦公日曆表」轉檔，請勿手動修改。
 * 資料年度：${csvFiles.map((name) => name.slice(9, 13)).join("、")}
 */
export const calendarDayList: CalendarDay[] = [
${rows}
];
`;

writeFileSync(OUTPUT_FILE, output);
console.log(`已輸出 ${OUTPUT_FILE}：${days.length} 筆`);
