import { describe, it, expect } from "vitest";
import { validateLeaveForm } from "./validate";
import type { ValidateContext } from "./validate";
import { employeeList, shiftList, leaveTypeList } from "../data/mockData";
import { calendarDayList } from "../data/calendarDays";
import type { AddLeaveFormRequest } from "../types/types";

/** 用某位人員當申請人建立驗證資料 */
function contextOf(employeeId: string): ValidateContext {
  const applicant = employeeList.find((emp) => emp.id === employeeId)!;
  const shift = shiftList.find((item) => item.id === applicant.shiftId)!;
  return {
    applicant,
    shift,
    leaveTypes: leaveTypeList,
    employees: employeeList,
    calendarDays: calendarDayList,
  };
}

/** 陳志豪（標準班）一張正確的特休：10/27 9:00–12:00，代理人張家豪、審核人王小明 */
const validInput: AddLeaveFormRequest = {
  leaveTypeId: "annual",
  relationId: "",
  startDate: "2026-10-27",
  startTime: "09:00",
  endDate: "2026-10-27",
  endTime: "12:00",
  deputyId: "E05",
  reviewerId: "E01",
  note: "",
};

const chen = contextOf("E03"); // 陳志豪，標準班
const lin = contextOf("E04"); // 林怡君，午班
const wang = contextOf("E01"); // 王小明，審核人

describe("正確的假單", () => {
  it("沒有錯誤，算出時數", () => {
    const result = validateLeaveForm(validInput, chen);
    expect(result.errors).toEqual({});
    expect(result.hours).toBe(3);
    expect(result.days).toEqual([
      { date: "2026-10-27", startTime: "09:00", endTime: "12:00", hours: 3 },
    ]);
  });

  it("天制的彈性假：11/2–11/3 = 16 小時", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "flex",
        startDate: "2026-11-02",
        startTime: null,
        endDate: "2026-11-03",
        endTime: null,
      },
      chen,
    );
    expect(result.errors).toEqual({});
    expect(result.hours).toBe(16);
  });
});

describe("VAL-01 必填", () => {
  it("什麼都沒填", () => {
    const result = validateLeaveForm(
      {
        leaveTypeId: "",
        relationId: "",
        startDate: "",
        startTime: null,
        endDate: "",
        endTime: null,
        deputyId: "",
        reviewerId: "",
        note: "",
      },
      chen,
    );
    expect(result.errors).toEqual({
      leaveTypeId: "請選擇假別",
      deputyId: "請選擇職務代理人",
      reviewerId: "請選擇審核人",
    });
  });

  it("沒選起訖", () => {
    const result = validateLeaveForm(
      { ...validInput, startDate: "", startTime: null, endTime: null },
      chen,
    );
    expect(result.errors.start).toBe("請選擇起始日期");
    expect(result.errors.end).toBe("請選擇結束時間");
  });

  it("喪假沒選親屬關係", () => {
    const result = validateLeaveForm(
      { ...validInput, leaveTypeId: "bereavement" },
      chen,
    );
    expect(result.errors.relationId).toBe("請選擇親屬關係");
  });

  it("職務代理人不能是自己", () => {
    const result = validateLeaveForm({ ...validInput, deputyId: "E03" }, chen);
    expect(result.errors.deputyId).toBe("職務代理人不能是自己");
  });

  it("審核人不能是自己（REV-01）", () => {
    const result = validateLeaveForm(
      { ...validInput, deputyId: "E02", reviewerId: "E01" },
      wang,
    );
    expect(result.errors.reviewerId).toBe("審核人不能是自己");
  });

  it("審核人要具審核人角色（REV-01）", () => {
    const result = validateLeaveForm({ ...validInput, reviewerId: "E06" }, chen);
    expect(result.errors.reviewerId).toBe("請從審核人名單中選擇");
  });
});

describe("VAL-02 結束要晚於開始", () => {
  it("結束早於開始", () => {
    const result = validateLeaveForm(
      { ...validInput, startTime: "12:00", endTime: "09:00" },
      chen,
    );
    expect(result.errors.end).toBe("結束時間需晚於開始時間");
  });

  it("結束等於開始", () => {
    const result = validateLeaveForm({ ...validInput, endTime: "09:00" }, chen);
    expect(result.errors.end).toBe("結束時間需晚於開始時間");
  });

  it("天制：結束日早於開始日", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "flex",
        startDate: "2026-11-03",
        startTime: null,
        endDate: "2026-11-02",
        endTime: null,
      },
      chen,
    );
    expect(result.errors.end).toBe("結束時間需晚於開始時間");
  });
});

describe("VAL-03 時間要在班別範圍內、在 30 分鐘格上", () => {
  it("午班選 9:00", () => {
    const result = validateLeaveForm(
      { ...validInput, startTime: "09:00", endTime: "14:00", deputyId: "E06" },
      lin,
    );
    expect(result.errors.start).toBe("請選擇 13:00–22:00 之間的半點時間");
    expect(result.errors.end).toBeUndefined();
  });

  it("標準班選 9:15", () => {
    const result = validateLeaveForm({ ...validInput, startTime: "09:15" }, chen);
    expect(result.errors.start).toBe("請選擇 9:00–19:00 之間的半點時間");
  });
});

describe("VAL-04 天制假別不能帶時間", () => {
  it("彈性假帶了時間", () => {
    const result = validateLeaveForm(
      { ...validInput, leaveTypeId: "flex" },
      chen,
    );
    expect(result.errors.start).toBe("彈性假只能以整天請假");
  });
});

describe("VAL-05 時數不能是 0", () => {
  it("10/24–10/26 都不是工作天", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        startDate: "2026-10-24",
        startTime: "09:00",
        endDate: "2026-10-26",
        endTime: "18:00",
      },
      chen,
    );
    expect(result.errors.hours).toBe("所選期間沒有工作天");
    expect(result.hours).toBe(0);
  });
});
