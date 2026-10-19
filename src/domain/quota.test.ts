import { describe, it, expect } from "vitest";
import {
  summarizeBatches,
  allocateDeductions,
  summarizeYear,
  getPerEventHours,
} from "./quota";
import { generateBatches } from "./batch";
import {
  employeeList,
  flexLeaveDateList,
  leaveFormList,
  leaveTypeList,
  bereavementRelationList,
} from "../data/mockData";
import type { Batch, Employee, LeaveForm } from "../types/types";

const TODAY = "2026-10-19";

function getForm(id: string) {
  return leaveFormList.find((form) => form.id === id)!;
}

/** 某位人員某個假別的批次 */
function batchesOf(employee: Employee, leaveTypeId: string, today = TODAY) {
  return generateBatches(employee, flexLeaveDateList, today).filter(
    (batch) => batch.leaveTypeId === leaveTypeId,
  );
}

/** 某位人員的假單，可以排除某一張（重算那一張時用） */
function formsOf(employeeId: string, excludeId?: string) {
  return leaveFormList.filter(
    (form) => form.employeeId === employeeId && form.id !== excludeId,
  );
}

const chen = employeeList[2]; // 陳志豪
const wang = employeeList[0]; // 王小明
const huang = employeeList[5]; // 黃雅婷

describe("allocateDeductions（QUOTA-01～03）", () => {
  it("規格範例（彈性假）：11/2 扣 1/2、11/3 扣 3/29 = L08 的扣除明細", () => {
    const summaries = summarizeBatches(
      batchesOf(chen, "flex"),
      formsOf("E03", "L08"),
    );
    const result = allocateDeductions(getForm("L08").days, summaries);
    expect(result.failedDate).toBeNull();
    expect(result.deductions).toEqual(getForm("L08").deductions);
  });

  it("L09：11/4 扣快到期的 2025/11/5、11/5 扣尚未生效的 2026/11/5（QUOTA-03）", () => {
    const summaries = summarizeBatches(
      batchesOf(huang, "annual"),
      formsOf("E06", "L09"),
    );
    const result = allocateDeductions(getForm("L09").days, summaries);
    expect(result.deductions).toEqual(getForm("L09").deductions);
  });

  it("規格範例（特休跨批次）：4/1 到職者 3/31 扣 2025/4/1、4/1 扣 2026/4/1", () => {
    const employee: Employee = { ...chen, id: "X", hireDate: "2024-04-01" };
    const summaries = summarizeBatches(
      batchesOf(employee, "annual", "2026-03-01"),
      [],
    );
    const result = allocateDeductions(
      [
        { date: "2026-03-31", startTime: "09:00", endTime: "18:00", hours: 8 },
        { date: "2026-04-01", startTime: "09:00", endTime: "18:00", hours: 8 },
      ],
      summaries,
    );
    expect(result.deductions).toEqual([
      { batchId: "annual:X:2025-04-01", date: "2026-03-31", hours: 8 },
      { batchId: "annual:X:2026-04-01", date: "2026-04-01", hours: 8 },
    ]);
  });

  it("一筆不夠再扣下一筆", () => {
    const batches: Batch[] = [
      {
        id: "A",
        leaveTypeId: "annual",
        name: "A",
        effectiveDate: "2026-01-01",
        expiryDate: "2026-12-31",
        hours: 4,
      },
      {
        id: "B",
        leaveTypeId: "annual",
        name: "B",
        effectiveDate: "2026-06-01",
        expiryDate: "2027-05-31",
        hours: 80,
      },
    ];
    const result = allocateDeductions(
      [{ date: "2026-10-27", startTime: "09:00", endTime: "18:00", hours: 8 }],
      summarizeBatches(batches, []),
    );
    expect(result.deductions).toEqual([
      { batchId: "A", date: "2026-10-27", hours: 4 },
      { batchId: "B", date: "2026-10-27", hours: 4 },
    ]);
  });

  it("沒有可扣的批次：回傳扣不到的那天（QUOTA-02）", () => {
    const zhang = employeeList[4]; // 張家豪，沒有特休批次
    const result = allocateDeductions(
      [{ date: "2026-10-27", startTime: "09:00", endTime: "18:00", hours: 8 }],
      summarizeBatches(batchesOf(zhang, "annual"), []),
    );
    expect(result).toEqual({ deductions: [], failedDate: "2026-10-27" });
  });

  it("可用時數用完就扣不到：陳志豪彈性假只剩 3 筆，請 4 天第 4 天失敗", () => {
    const summaries = summarizeBatches(batchesOf(chen, "flex"), formsOf("E03"));
    const days = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"].map(
      (date) => ({ date, startTime: "09:00", endTime: "18:00", hours: 8 }),
    );
    expect(allocateDeductions(days, summaries).failedDate).toBe("2026-11-19");
  });
});

describe("summarizeBatches（F-04 額度狀態）", () => {
  it("王小明特休（2026/4/1）：L04 撤銷審核中仍算已使用 7 小時", () => {
    const [summary] = summarizeBatches(
      batchesOf(wang, "annual").filter((b) => b.effectiveDate === "2026-04-01"),
      formsOf("E01"),
    );
    expect(summary).toMatchObject({ used: 7, reserved: 0, available: 129 });
  });

  it("同意撤銷後退回原批次（QUOTA-04）", () => {
    const forms: LeaveForm[] = formsOf("E01").map((form) =>
      form.id === "L04" ? { ...form, status: "revoked" } : form,
    );
    const [summary] = summarizeBatches(
      batchesOf(wang, "annual").filter((b) => b.effectiveDate === "2026-04-01"),
      forms,
    );
    expect(summary).toMatchObject({ used: 0, available: 136 });
  });

  it("待審核的 L08 算審核中", () => {
    const summaries = summarizeBatches(batchesOf(chen, "flex"), formsOf("E03"));
    expect(summaries.map((s) => s.reserved)).toEqual([8, 8, 0, 0, 0]);
  });
});

describe("summarizeYear（QUOTA-05）", () => {
  it("張家豪病假：L07 待審核 8 小時", () => {
    const forms = formsOf("E05").filter((form) => form.leaveTypeId === "sick");
    expect(summarizeYear(2026, forms)).toEqual({ used: 0, reserved: 8 });
  });

  it("林怡君病假：L02 已核准 4 小時；事假 L06 已撤銷不算", () => {
    const sick = formsOf("E04").filter((form) => form.leaveTypeId === "sick");
    const personal = formsOf("E04").filter((f) => f.leaveTypeId === "personal");
    expect(summarizeYear(2026, sick)).toEqual({ used: 4, reserved: 0 });
    expect(summarizeYear(2026, personal)).toEqual({ used: 0, reserved: 0 });
  });

  it("跨年假單分別算進各年度", () => {
    const form: LeaveForm = {
      ...getForm("L07"),
      days: [
        { date: "2026-12-31", startTime: "09:00", endTime: "18:00", hours: 8 },
        { date: "2027-01-04", startTime: "09:00", endTime: "12:00", hours: 3 },
      ],
      hours: 11,
    };
    expect(summarizeYear(2026, [form]).reserved).toBe(8);
    expect(summarizeYear(2027, [form]).reserved).toBe(3);
  });
});

describe("getPerEventHours（QUOTA-07）", () => {
  const marriage = leaveTypeList.find((type) => type.id === "marriage")!;
  const bereavement = leaveTypeList.find((type) => type.id === "bereavement")!;
  const relation = (id: string) =>
    bereavementRelationList.find((item) => item.id === id);

  it("婚假每次 64 小時", () => {
    expect(getPerEventHours(marriage, undefined)).toBe(64);
  });

  it("喪假依親屬關係 64／48／24 小時", () => {
    expect(getPerEventHours(bereavement, relation("parent"))).toBe(64);
    expect(getPerEventHours(bereavement, relation("grandparent"))).toBe(48);
    expect(getPerEventHours(bereavement, relation("sibling"))).toBe(24);
  });

  it("喪假還沒選親屬是 null", () => {
    expect(getPerEventHours(bereavement, undefined)).toBeNull();
  });
});
