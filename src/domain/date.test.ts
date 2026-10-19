import { describe, it, expect } from "vitest";
import {
  addDays,
  addMonths,
  getDaysInMonth,
  getWeekday,
  isLeapYear,
  toMinutes,
  fromMinutes,
} from "./date";

describe("addDays", () => {
  it("跨年", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("往前跨月", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("閏年 2 月有 29 日", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("加 0 天不變", () => {
    expect(addDays("2026-10-19", 0)).toBe("2026-10-19");
  });
});

describe("addMonths", () => {
  it("8/31 加 6 個月落在平年 2 月，取 2/28（LEAVE-03）", () => {
    expect(addMonths("2020-08-31", 6)).toBe("2021-02-28");
  });

  it("8/31 加 6 個月落在閏年 2 月，取 2/29", () => {
    expect(addMonths("2023-08-31", 6)).toBe("2024-02-29");
  });

  it("一般日期加 6 個月", () => {
    expect(addMonths("2024-03-01", 6)).toBe("2024-09-01");
  });

  it("跨年", () => {
    expect(addMonths("2026-11-25", 1)).toBe("2026-12-25");
    expect(addMonths("2026-12-10", 1)).toBe("2027-01-10");
  });

  it("往前跨年", () => {
    expect(addMonths("2027-01-10", -1)).toBe("2026-12-10");
  });

  it("3/31 往前 1 個月取 2 月最後一天、往後 1 個月取 4/30（LEAVE-11）", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2028-03-31", -1)).toBe("2028-02-29");
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
  });

  it("加 12 個月等於加 1 年", () => {
    expect(addMonths("2025-11-05", 12)).toBe("2026-11-05");
  });
});

describe("getDaysInMonth", () => {
  it("各月天數", () => {
    expect(getDaysInMonth(2026, 1)).toBe(31);
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2028, 2)).toBe(29);
    expect(getDaysInMonth(2026, 4)).toBe(30);
  });
});

describe("isLeapYear", () => {
  it("判斷閏年", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });
});

describe("getWeekday", () => {
  it("2026/10/19 是星期一、10/24 是星期六、11/1 是星期日", () => {
    expect(getWeekday("2026-10-19")).toBe(1);
    expect(getWeekday("2026-10-24")).toBe(6);
    expect(getWeekday("2026-11-01")).toBe(0);
  });
});

describe("toMinutes / fromMinutes", () => {
  it("時間與分鐘互轉", () => {
    expect(toMinutes("09:00")).toBe(540);
    expect(toMinutes("13:30")).toBe(810);
    expect(fromMinutes(540)).toBe("09:00");
    expect(fromMinutes(810)).toBe("13:30");
    expect(fromMinutes(toMinutes("22:00"))).toBe("22:00");
  });
});
