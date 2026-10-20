import { describe, it, expect } from "vitest";
import { getTimeOptions, calcDayHours, splitLeaveDays, sumHours } from "./time";
import { shiftList } from "../data/mockData";
import { calendarDayList } from "../data/calendarDays";
import type { CalendarDay, LeaveUnit } from "../types/domain";

const morning = shiftList[0]; // 早班
const middle = shiftList[1]; // 中班

/** 用早班或中班算一段請假的總時數 */
function totalHours(
  shift: typeof morning,
  start: string,
  end: string,
  unit: LeaveUnit = "half_hour",
  calendarDays: CalendarDay[] = calendarDayList,
) {
  const [startDate, startTime] = start.split(" ");
  const [endDate, endTime] = end.split(" ");
  const days = splitLeaveDays({
    unit,
    startDate,
    startTime: startTime ?? null,
    endDate,
    endTime: endTime ?? null,
    shift,
    calendarDays,
  });
  return sumHours(days);
}

describe("getTimeOptions（TIME-01）", () => {
  it("早班 9:00～18:00 每 30 分鐘一格", () => {
    const options = getTimeOptions(morning);
    expect(options[0]).toBe("09:00");
    expect(options[1]).toBe("09:30");
    expect(options[options.length - 1]).toBe("18:00");
    expect(options).toHaveLength(19);
  });

  it("中班 13:00～22:00", () => {
    const options = getTimeOptions(middle);
    expect(options[0]).toBe("13:00");
    expect(options[options.length - 1]).toBe("22:00");
    expect(options).toHaveLength(19);
  });
});

describe("calcDayHours（TIME-03）規格範例：早班", () => {
  it.each([
    ["09:00", "12:00", 3],
    ["09:30", "12:00", 2.5],
    ["12:30", "13:30", 0.5],
    ["09:00", "18:00", 8],
    ["14:00", "17:30", 3.5],
  ])("%s–%s = %d 小時", (start, end, hours) => {
    expect(calcDayHours(start, end, morning)).toBe(hours);
  });

  it("整段都在休息時間是 0", () => {
    expect(calcDayHours("12:00", "13:00", morning)).toBe(0);
  });

  it("結束早於開始是 0", () => {
    expect(calcDayHours("17:30", "17:00", morning)).toBe(0);
  });
});

describe("calcDayHours（TIME-03）規格範例：中班", () => {
  it.each([
    ["13:00", "17:00", 4],
    ["15:00", "20:00", 4], // 5 − 休息 1
    ["13:00", "22:00", 8], // 9 − 休息 1
  ])("%s–%s = %d 小時", (start, end, hours) => {
    expect(calcDayHours(start, end, middle)).toBe(hours);
  });
});

describe("splitLeaveDays（TIME-04～06）", () => {
  it("規格範例：週三 14:00 – 週四 12:00 = 4 + 3 = 7 小時", () => {
    const days = splitLeaveDays({
      unit: "half_hour",
      startDate: "2026-10-21",
      startTime: "14:00",
      endDate: "2026-10-22",
      endTime: "12:00",
      shift: morning,
      calendarDays: calendarDayList,
    });
    expect(days).toEqual([
      { date: "2026-10-21", startTime: "14:00", endTime: "18:00", hours: 4 },
      { date: "2026-10-22", startTime: "09:00", endTime: "12:00", hours: 3 },
    ]);
  });

  it("規格範例：週五 9:00 – 下週一 18:00 = 16 小時（週末不計）", () => {
    expect(totalHours(morning, "2026-10-16 09:00", "2026-10-19 18:00")).toBe(16);
  });

  it("中間的天是整天", () => {
    // 10/19（一）14:00 – 10/21（三）12:00：4 + 8 + 3
    expect(totalHours(morning, "2026-10-19 14:00", "2026-10-21 12:00")).toBe(15);
  });

  it("天制每個工作天記整天：11/2–11/3 = 16 小時", () => {
    const days = splitLeaveDays({
      unit: "day",
      startDate: "2026-11-02",
      startTime: null,
      endDate: "2026-11-03",
      endTime: null,
      shift: morning,
      calendarDays: calendarDayList,
    });
    expect(days).toEqual([
      { date: "2026-11-02", startTime: "09:00", endTime: "18:00", hours: 8 },
      { date: "2026-11-03", startTime: "09:00", endTime: "18:00", hours: 8 },
    ]);
  });

  it("中班的天制整天是 13:00–22:00", () => {
    const days = splitLeaveDays({
      unit: "day",
      startDate: "2026-10-30",
      startTime: null,
      endDate: "2026-10-30",
      endTime: null,
      shift: middle,
      calendarDays: calendarDayList,
    });
    expect(days).toEqual([
      { date: "2026-10-30", startTime: "13:00", endTime: "22:00", hours: 8 },
    ]);
  });

  it("跨國定假日略過：10/23（五）– 10/27（二）只算 10/23、10/27", () => {
    expect(totalHours(morning, "2026-10-23", "2026-10-27", "day")).toBe(16);
  });

  it("全落在非工作天是 0（VAL-05）", () => {
    expect(totalHours(morning, "2026-10-24 09:00", "2026-10-26 18:00")).toBe(0);
  });

  it("補班日計入（用測試資料）", () => {
    const days: CalendarDay[] = [
      { date: "2026-11-07", type: "makeup_workday", name: "補行上班" },
    ];
    // 11/6（五）– 11/9（一），11/7（六）補班：3 天
    expect(totalHours(morning, "2026-11-06", "2026-11-09", "day", days)).toBe(24);
  });

  it("起始日不是工作天時，起始時間不套用", () => {
    // 10/24（六）14:00 – 10/27（二）12:00：只有 10/27 9:00–12:00
    expect(totalHours(morning, "2026-10-24 14:00", "2026-10-27 12:00")).toBe(3);
  });

  it("第一天起始時間等於整天區間結束，那天不記", () => {
    // 10/19 18:00 – 10/20 12:00：10/19 是 0 小時，只記 10/20
    const days = splitLeaveDays({
      unit: "half_hour",
      startDate: "2026-10-19",
      startTime: "18:00",
      endDate: "2026-10-20",
      endTime: "12:00",
      shift: morning,
      calendarDays: calendarDayList,
    });
    expect(days.map((day) => day.date)).toEqual(["2026-10-20"]);
  });
});
