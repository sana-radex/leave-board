import { describe, it, expect } from "vitest";
import { isWorkday, getWorkdays } from "./calendar";
import { calendarDayList } from "../data/calendarDays";
import type { CalendarDay } from "../types/domain";

describe("isWorkday", () => {
  it("一般平日是工作天", () => {
    expect(isWorkday("2026-10-19", calendarDayList)).toBe(true);
  });

  it("週六、週日不是工作天", () => {
    expect(isWorkday("2026-10-24", calendarDayList)).toBe(false);
    expect(isWorkday("2026-11-01", calendarDayList)).toBe(false);
  });

  it("國定假日、補假不是工作天", () => {
    expect(isWorkday("2026-10-09", calendarDayList)).toBe(false); // 國慶日補假
    expect(isWorkday("2026-10-26", calendarDayList)).toBe(false); // 光復節補假
  });

  it("10/24～10/26 都不是工作天（週六、光復節、補假）", () => {
    expect(getWorkdays("2026-10-24", "2026-10-26", calendarDayList)).toEqual([]);
  });

  it("補班日是工作天（政府資料 2026、2027 沒有補班日，用測試資料）", () => {
    const days: CalendarDay[] = [
      { date: "2026-11-07", type: "makeup_workday", name: "補行上班" },
    ];
    expect(isWorkday("2026-11-07", days)).toBe(true);
    expect(isWorkday("2026-11-08", days)).toBe(false);
  });
});

describe("getWorkdays", () => {
  it("週五到下週一只有頭尾兩天", () => {
    expect(getWorkdays("2026-10-16", "2026-10-19", calendarDayList)).toEqual([
      "2026-10-16",
      "2026-10-19",
    ]);
  });

  it("同一天", () => {
    expect(getWorkdays("2026-10-20", "2026-10-20", calendarDayList)).toEqual([
      "2026-10-20",
    ]);
  });

  it("結束早於開始時沒有工作天", () => {
    expect(getWorkdays("2026-10-21", "2026-10-20", calendarDayList)).toEqual([]);
  });

  it("跨年", () => {
    // 12/31（四）、1/1 開國紀念日、1/2（六）、1/3（日）、1/4（一）
    expect(getWorkdays("2026-12-31", "2027-01-04", calendarDayList)).toEqual([
      "2026-12-31",
      "2027-01-04",
    ]);
  });
});
