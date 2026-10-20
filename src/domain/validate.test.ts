import { describe, it, expect } from "vitest";
import { validateLeaveForm } from "./validate";
import type { ValidateContext } from "./validate";
import {
  employeeList,
  shiftList,
  leaveTypeList,
  bereavementRelationList,
  flexLeaveDateList,
  leaveFormList,
} from "../data/mockData";
import { calendarDayList } from "../data/calendarDays";
import { generateBatches } from "./batch";
import type { Employee } from "../types/domain";
import type { AddLeaveFormRequest } from "../types/api";

/** 今天：2026/10/19（基準日） */
const TODAY = "2026-10-19";

/** 用某位人員當申請人建立驗證資料 */
function contextOf(applicant: Employee): ValidateContext {
  const shift = shiftList.find((item) => item.id === applicant.shiftId)!;
  return {
    applicant,
    shift,
    leaveTypes: leaveTypeList,
    relations: bereavementRelationList,
    employees: employeeList,
    calendarDays: calendarDayList,
    batches: generateBatches(applicant, flexLeaveDateList, TODAY),
    forms: leaveFormList,
  };
}

/** 用預設資料的人員 id 建立驗證資料 */
function contextOfId(employeeId: string): ValidateContext {
  return contextOf(employeeList.find((emp) => emp.id === employeeId)!);
}

/** 陳志豪（早班）一張正確的特休：10/27 9:00–12:00，代理人林怡君、審核人王小明 */
const validInput: AddLeaveFormRequest = {
  leaveTypeId: "annual",
  relationId: "",
  startDate: "2026-10-27",
  startTime: "09:00",
  endDate: "2026-10-27",
  endTime: "12:00",
  deputyId: "E04",
  reviewerId: "E01",
  note: "",
};

const chen = contextOfId("E03"); // 陳志豪，早班
const lin = contextOfId("E04"); // 林怡君，中班
const wang = contextOfId("E01"); // 王小明，審核人

describe("正確的假單", () => {
  it("沒有錯誤，算出時數", () => {
    const result = validateLeaveForm(validInput, chen);
    expect(result.errors).toEqual({});
    expect(result.hours).toBe(3);
    expect(result.days).toEqual([
      { date: "2026-10-27", startTime: "09:00", endTime: "12:00", hours: 3 },
    ]);
  });

  it("天制的彈性假：11/16–11/17 = 16 小時；2026 年度 5 天，L08 預留 2 天，可用 24 小時", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "flex",
        startDate: "2026-11-16",
        startTime: null,
        endDate: "2026-11-17",
        endTime: null,
      },
      chen,
    );
    expect(result.errors).toEqual({});
    expect(result.hours).toBe(16);
    expect(result.quotaLines).toEqual([
      { label: "", available: 24, remaining: 8 },
    ]);
  });

  it("特休的可用額度與送出後剩餘：陳志豪可用 77 小時，請 3 小時剩 74", () => {
    const result = validateLeaveForm(validInput, chen);
    expect(result.quotaLines).toEqual([
      { label: "", available: 77, remaining: 74 },
    ]);
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
    // 林怡君是提交人
    const result = validateLeaveForm({ ...validInput, reviewerId: "E04" }, chen);
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
  it("中班選 9:00", () => {
    const result = validateLeaveForm(
      { ...validInput, startTime: "09:00", endTime: "14:00", deputyId: "E03" },
      lin,
    );
    expect(result.errors.start).toBe("請選擇 13:00–22:00 之間的半點時間");
    expect(result.errors.end).toBeUndefined();
  });

  it("早班選 9:15", () => {
    const result = validateLeaveForm({ ...validInput, startTime: "09:15" }, chen);
    expect(result.errors.start).toBe("請選擇 9:00–18:00 之間的半點時間");
  });

  it("早班選 18:30：超過可選範圍", () => {
    const result = validateLeaveForm({ ...validInput, endTime: "18:30" }, chen);
    expect(result.errors.end).toBe("請選擇 9:00–18:00 之間的半點時間");
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

describe("VAL-06 可用額度不足", () => {
  it("批次型：7/1 到職未滿 6 個月，沒有特休批次", () => {
    const newcomer: Employee = { ...employeeList[2], hireDate: "2026-07-01" };
    const result = validateLeaveForm(validInput, contextOf(newcomer));
    expect(result.errors.quota).toBe("10/27 沒有可用的特休");
  });

  it("批次型：彈性假到請假日為止公布的天數不夠（L08 之後再請 11/4–11/6，11/12 才公布第 5 天）", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "flex",
        startDate: "2026-11-04",
        startTime: null,
        endDate: "2026-11-06",
        endTime: null,
      },
      chen,
    );
    expect(result.errors.quota).toBe("11/6 沒有可用的彈性假");
  });

  it("批次型：插在前面讓自己之後的假單不夠（另有已核准的 11/4–11/5，再請 10/30）", () => {
    const l08 = leaveFormList.find((form) => form.id === "L08")!;
    const context: ValidateContext = {
      ...chen,
      forms: [
        ...leaveFormList,
        {
          ...l08,
          id: "X",
          status: "approved",
          days: ["2026-11-04", "2026-11-05"].map((date) => ({
            date,
            startTime: "09:00",
            endTime: "18:00",
            hours: 8,
          })),
        },
      ],
    };
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "flex",
        startDate: "2026-10-30",
        startTime: null,
        endDate: "2026-10-30",
        endTime: null,
      },
      context,
    );
    expect(result.errors.quota).toBe("請這張之後，11/5 的彈性假會不夠");
  });

  it("曆年制：林怡君事假 11/2–11/20 共 15 天 = 120 小時，超過 112", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "personal",
        startDate: "2026-11-02",
        startTime: "13:00",
        endDate: "2026-11-20",
        endTime: "22:00",
        deputyId: "E03",
      },
      lin,
    );
    expect(result.hours).toBe(120);
    expect(result.errors.quota).toBe("可用額度不足：可用 112 小時，本次 120 小時");
  });

  it("曆年制：已使用、審核中要扣掉（陳志豪病假 L07 審核中 8 小時）", () => {
    const result = validateLeaveForm(
      { ...validInput, leaveTypeId: "sick" },
      chen,
    );
    expect(result.quotaLines).toEqual([
      { label: "", available: 232, remaining: 229 },
    ]);
  });
});

describe("VAL-07 婚假、喪假單張超過該次額度", () => {
  it("李美玲喪假（祖父母）11/16–11/24 共 7 天", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "bereavement",
        relationId: "grandparent",
        startDate: "2026-11-16",
        startTime: "09:00",
        endDate: "2026-11-24",
        endTime: "18:00",
        deputyId: "E01",
        reviewerId: "E01",
      },
      contextOfId("E02"),
    );
    expect(result.errors.hours).toBe("喪假（祖父母）每次最多 6 日");
  });

  it("婚假 9 天超過 8 日；該次額度 64 小時", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "marriage",
        startDate: "2026-11-16",
        startTime: "09:00",
        endDate: "2026-11-26",
        endTime: "18:00",
      },
      chen,
    );
    expect(result.errors.hours).toBe("婚假每次最多 8 日");
    expect(result.quotaLines).toEqual([
      { label: "", available: 64, remaining: null },
    ]);
  });
});

describe("沒有補請期限、時段重疊檢查：照常可以送出", () => {
  it("請假日早於今天（10/8）", () => {
    const result = validateLeaveForm(
      { ...validInput, startDate: "2026-10-08", endDate: "2026-10-08" },
      chen,
    );
    expect(result.errors).toEqual({});
  });

  it("和自己的 L01（10/20 9:00–12:00）時段重疊", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        startDate: "2026-10-20",
        startTime: "10:00",
        endDate: "2026-10-20",
        endTime: "11:00",
      },
      chen,
    );
    expect(result.errors).toEqual({});
  });
});
