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
import type { AddLeaveFormRequest } from "../types/types";

/** 用某位人員當申請人建立驗證資料；今天預設 2026/10/19（基準日） */
function contextOf(employeeId: string, today = "2026-10-19"): ValidateContext {
  const applicant = employeeList.find((emp) => emp.id === employeeId)!;
  const shift = shiftList.find((item) => item.id === applicant.shiftId)!;
  return {
    today,
    applicant,
    shift,
    leaveTypes: leaveTypeList,
    relations: bereavementRelationList,
    employees: employeeList,
    calendarDays: calendarDayList,
    batches: generateBatches(applicant, flexLeaveDateList, today),
    forms: leaveFormList,
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

  it("天制的彈性假：11/16–11/17 = 16 小時，扣 9/28、10/31（1/2、3/29 已被 L08 預留）", () => {
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
    expect(result.deductions).toEqual([
      { batchId: "flex:E03:2026-09-28", date: "2026-11-16", hours: 8 },
      { batchId: "flex:E03:2026-10-31", date: "2026-11-17", hours: 8 },
    ]);
  });

  it("特休的可用額度與送出後剩餘：陳志豪可用 77 小時，請 3 小時剩 74", () => {
    const result = validateLeaveForm(validInput, chen);
    expect(result.quotaLines).toEqual([
      { label: "", available: 77, remaining: 74 },
    ]);
    expect(result.deductions).toEqual([
      { batchId: "annual:E03:2026-03-01", date: "2026-10-27", hours: 3 },
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

describe("VAL-06 可用額度不足", () => {
  it("批次型：張家豪沒有特休批次", () => {
    const result = validateLeaveForm(
      { ...validInput, deputyId: "E03", reviewerId: "E02" },
      contextOf("E05"),
    );
    expect(result.errors.quota).toBe("10/27 沒有可用的特休");
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
        deputyId: "E06",
      },
      lin,
    );
    expect(result.hours).toBe(120);
    expect(result.errors.quota).toBe("可用額度不足：可用 112 小時，本次 120 小時");
  });

  it("曆年制：已使用、審核中要扣掉（張家豪病假 L07 審核中 8 小時）", () => {
    const result = validateLeaveForm(
      { ...validInput, leaveTypeId: "sick", deputyId: "E03" },
      contextOf("E05"),
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
      contextOf("E02"),
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

describe("VAL-08 和自己其他假單時段重疊", () => {
  it("陳志豪再請 10/20 10:00–11:00 特休（L01 是 9:00–12:00）", () => {
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
    expect(result.errors.start).toBe("與 10/20 特休假單時段重疊");
  });

  it("同一天但時段沒有交集不算重疊（10/20 13:00–15:00）", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        startDate: "2026-10-20",
        startTime: "13:00",
        endDate: "2026-10-20",
        endTime: "15:00",
      },
      chen,
    );
    expect(result.errors.start).toBeUndefined();
  });

  it("已撤銷的假單不算（李美玲 L05 10/16 已撤銷）", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        startDate: "2026-10-16",
        endDate: "2026-10-16",
        deputyId: "E01",
        reviewerId: "E01",
      },
      contextOf("E02"),
    );
    expect(result.errors.start).toBeUndefined();
  });
});

describe("VAL-09 補請期限（RETRO-01）", () => {
  it("今天 10/19 補請 10/12：期限 10/19，可以送出", () => {
    const result = validateLeaveForm(
      { ...validInput, startDate: "2026-10-12", endDate: "2026-10-12" },
      chen,
    );
    expect(result.retroDeadline).toBe("2026-10-19");
    expect(result.errors).toEqual({});
  });

  it("今天 10/19 補請 10/8：期限 10/16，已超過", () => {
    const result = validateLeaveForm(
      { ...validInput, startDate: "2026-10-08", endDate: "2026-10-08" },
      chen,
    );
    expect(result.errors.start).toBe("已超過補請期限 10/16");
  });

  it("規格範例：假期 10/16 結束，今天 10/23 可補請、10/26 被擋", () => {
    const input = { ...validInput, startDate: "2026-10-16", endDate: "2026-10-16" };
    expect(validateLeaveForm(input, contextOf("E03", "2026-10-23")).errors).toEqual({});
    expect(validateLeaveForm(input, contextOf("E03", "2026-10-26")).errors.start).toBe(
      "已超過補請期限 10/23",
    );
  });

  it("不是補請就沒有期限", () => {
    expect(validateLeaveForm(validInput, chen).retroDeadline).toBeNull();
  });
});

describe("VAL-10 職務代理人同時段請假中：只提醒，不擋", () => {
  it("黃雅婷 10/20 10:00–11:00 事假，代理人陳志豪（L01 同時段）", () => {
    const result = validateLeaveForm(
      {
        ...validInput,
        leaveTypeId: "personal",
        startDate: "2026-10-20",
        startTime: "10:00",
        endDate: "2026-10-20",
        endTime: "11:00",
        deputyId: "E03",
      },
      contextOf("E06"),
    );
    expect(result.warnings.deputyId).toBe("陳志豪 10/20 同時段請假中");
    expect(result.errors).toEqual({});
  });
});
