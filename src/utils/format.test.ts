import { describe, it, expect } from "vitest";
import { formatDate, formatTime, formatLeaveRange, formatHours } from "./format";

describe("formatDate / formatTime", () => {
  it("月、日、小時前面不補 0", () => {
    expect(formatDate("2026-03-01")).toBe("2026/3/1");
    expect(formatDate("2026-10-20")).toBe("2026/10/20");
    expect(formatTime("09:00")).toBe("9:00");
    expect(formatTime("13:30")).toBe("13:30");
  });
});

describe("formatLeaveRange", () => {
  it("同一天", () => {
    expect(formatLeaveRange("2026-10-20T09:00", "2026-10-20T12:00", "half_hour"))
      .toBe("2026/10/20 9:00–12:00");
  });

  it("跨日", () => {
    expect(formatLeaveRange("2026-10-28T14:00", "2026-10-29T12:00", "half_hour"))
      .toBe("2026/10/28 14:00 – 2026/10/29 12:00");
  });

  it("天制只顯示日期", () => {
    expect(formatLeaveRange("2026-11-02T09:00", "2026-11-03T18:00", "day"))
      .toBe("2026/11/2 – 2026/11/3");
    expect(formatLeaveRange("2026-11-06T09:00", "2026-11-06T18:00", "day"))
      .toBe("2026/11/6");
  });

  it("看不到假別（null）時照時間顯示", () => {
    expect(formatLeaveRange("2026-11-06T09:00", "2026-11-06T18:00", null))
      .toBe("2026/11/6 9:00–18:00");
  });
});

describe("formatHours", () => {
  it("天＋小時（F-04 範例：20 小時 = 2 天 4 小時）", () => {
    expect(formatHours(20)).toBe("2 天 4 小時");
    expect(formatHours(8)).toBe("1 天");
    expect(formatHours(16)).toBe("2 天");
    expect(formatHours(3)).toBe("3 小時");
    expect(formatHours(0.5)).toBe("0.5 小時");
    expect(formatHours(0)).toBe("0 小時");
    expect(formatHours(77)).toBe("9 天 5 小時");
  });
});
