import { describe, it, expect } from "vitest";
import { allocateBatches, summarizeYear, getPerEventHours } from "./quota";
import type { AllocateForm, BatchSummary } from "./quota";
import { generateBatches } from "./batch";
import {
  employeeList,
  flexLeaveDateList,
  leaveFormList,
  leaveTypeList,
  bereavementRelationList,
} from "../data/mockData";
import type {
  Batch,
  Employee,
  LeaveForm,
  LeaveStatus,
  LeaveTypeId,
} from "../types/types";

const TODAY = "2026-10-19";

function getForm(id: string) {
  return leaveFormList.find((form) => form.id === id)!;
}

/** 某位人員某個假別的批次 */
function batchesOf(
  employee: Employee,
  leaveTypeId: LeaveTypeId,
  today = TODAY,
  flexDates = flexLeaveDateList,
) {
  return generateBatches(employee, flexDates, today).filter(
    (batch) => batch.leaveTypeId === leaveTypeId,
  );
}

/** 某位人員的假單，可以只留某個假別 */
function formsOf(employeeId: string, leaveTypeId?: LeaveTypeId) {
  return leaveFormList.filter(
    (form) =>
      form.employeeId === employeeId &&
      (!leaveTypeId || form.leaveTypeId === leaveTypeId),
  );
}

/** 自己組一張假單：每天 8 小時 */
function formOf(
  id: string,
  dates: string[],
  status: LeaveStatus = "pending",
): AllocateForm {
  return {
    id,
    status,
    days: dates.map((date) => ({
      date,
      startTime: "09:00",
      endTime: "18:00",
      hours: 8,
    })),
  };
}

/** 找某個名稱的批次的使用情形 */
function summaryOf(summaries: BatchSummary[], name: string) {
  return summaries.find((summary) => summary.batch.name === name)!;
}

const chen = employeeList[2]; // 陳志豪
const wang = employeeList[0]; // 王小明
const lin = employeeList[3]; // 林怡君

/** 跨年情境用：2026 年的公布日，加上 2027/1/4 公布一天 */
const flexDatesTo2027 = [...flexLeaveDateList, { date: "2027-01-04" }];

describe("allocateBatches：依請假日分配（QUOTA-01～04）", () => {
  it("規格範例（彈性假）：L08 11/2–11/3，到 11/3 已公布 4 天，分配得到", () => {
    const { summaries, failedDays } = allocateBatches(
      batchesOf(chen, "flex"),
      formsOf("E03", "flex"),
    );
    expect(failedDays).toEqual([]);
    expect(summaryOf(summaries, "彈性假（2026 年度）").reserved).toBe(16);
  });

  it("L09：11/4 落在 2025/11/5 那筆、11/5 落在尚未生效的 2026/11/5 那筆（QUOTA-03）", () => {
    const { summaries } = allocateBatches(
      batchesOf(lin, "annual"),
      formsOf("E04", "annual"),
    );
    expect(summaryOf(summaries, "特休（2025/11/5）").reserved).toBe(8);
    expect(summaryOf(summaries, "特休（2026/11/5）").reserved).toBe(8);
  });

  it("規格範例（特休跨批次）：4/1 到職者 3/31 落在 2025/4/1、4/1 落在 2026/4/1", () => {
    const employee: Employee = { ...chen, id: "X", hireDate: "2024-04-01" };
    const { summaries } = allocateBatches(
      batchesOf(employee, "annual", "2026-03-01"),
      [formOf("A", ["2026-03-31", "2026-04-01"])],
    );
    expect(summaryOf(summaries, "特休（2025/4/1）").reserved).toBe(8);
    expect(summaryOf(summaries, "特休（2026/4/1）").reserved).toBe(8);
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
        releases: [{ date: "2026-01-01", hours: 4 }],
      },
      {
        id: "B",
        leaveTypeId: "annual",
        name: "B",
        effectiveDate: "2026-06-01",
        expiryDate: "2027-05-31",
        hours: 80,
        releases: [{ date: "2026-06-01", hours: 80 }],
      },
    ];
    const { summaries } = allocateBatches(batches, [
      formOf("X", ["2026-10-27"]),
    ]);
    expect(summaries.map((summary) => summary.reserved)).toEqual([4, 4]);
  });

  it("沒有可用的批次：回傳分配不到的那天和假單（QUOTA-02）", () => {
    // 7/1 到職未滿 6 個月，沒有特休批次
    const newcomer: Employee = { ...chen, hireDate: "2026-07-01" };
    const { failedDays } = allocateBatches(batchesOf(newcomer, "annual"), [
      formOf("X", ["2026-10-27"]),
    ]);
    expect(failedDays).toEqual([{ date: "2026-10-27", formId: "X" }]);
  });

  it("彈性假公布進度：到 11/6 只公布 4 天，L08 之後再請 11/4–11/6 第 3 天不夠", () => {
    const { failedDays } = allocateBatches(batchesOf(chen, "flex"), [
      ...formsOf("E03", "flex"),
      formOf("X", ["2026-11-04", "2026-11-05", "2026-11-06"]),
    ]);
    expect(failedDays).toEqual([{ date: "2026-11-06", formId: "X" }]);
  });

  it("送出順序不影響：先送 11/20、再送 11/4–11/5，加上 L08 剛好 5 天都分配得到", () => {
    const later = formOf("A", ["2026-11-20"]);
    const earlier = formOf("B", ["2026-11-04", "2026-11-05"]);
    for (const forms of [
      [...formsOf("E03", "flex"), later, earlier],
      [...formsOf("E03", "flex"), earlier, later],
    ]) {
      const { summaries, failedDays } = allocateBatches(
        batchesOf(chen, "flex"),
        forms,
      );
      expect(failedDays).toEqual([]);
      expect(summaryOf(summaries, "彈性假（2026 年度）").available).toBe(0);
    }
  });

  it("1–2 月先用前一年度：2027/2/10 算 2026 年度的，2027 年度不動", () => {
    const { summaries } = allocateBatches(
      batchesOf(chen, "flex", "2027-01-10", flexDatesTo2027),
      [
        formOf("A", ["2026-11-16", "2026-11-17", "2026-11-18"], "approved"),
        formOf("B", ["2027-02-10"]),
      ],
    );
    expect(summaryOf(summaries, "彈性假（2026 年度）")).toMatchObject({
      used: 24,
      reserved: 8,
      available: 8,
    });
    expect(summaryOf(summaries, "彈性假（2027 年度）").reserved).toBe(0);
  });

  it("撤銷後依請假日重算：1/11 那張撤銷，2/10 那張改算 2026 年度，2027 年度空出來", () => {
    const batches = batchesOf(chen, "flex", "2027-01-10", flexDatesTo2027);
    const used2026 = formOf(
      "A",
      ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"],
      "approved",
    );
    const january = formOf("J", ["2027-01-11"], "approved");
    const february = formOf("F", ["2027-02-10"]);

    // 撤銷前：2026 年度最後 1 天給 1/11，2/10 只能用 2027 年度的
    const before = allocateBatches(batches, [used2026, january, february]);
    expect(summaryOf(before.summaries, "彈性假（2027 年度）").reserved).toBe(8);

    // 撤銷 1/11 後：2/10 改用 2026 年度
    const after = allocateBatches(batches, [
      used2026,
      { ...january, status: "revoked" },
      february,
    ]);
    expect(summaryOf(after.summaries, "彈性假（2026 年度）").reserved).toBe(8);
    expect(summaryOf(after.summaries, "彈性假（2027 年度）").reserved).toBe(0);
  });

  it("王小明特休（2026/4/1）：L04 撤銷審核中仍算已使用 7 小時", () => {
    const { summaries } = allocateBatches(
      batchesOf(wang, "annual"),
      formsOf("E01", "annual"),
    );
    expect(summaryOf(summaries, "特休（2026/4/1）")).toMatchObject({
      used: 7,
      reserved: 0,
      available: 129,
    });
  });

  it("同意撤銷後釋放額度", () => {
    const forms: LeaveForm[] = formsOf("E01", "annual").map((form) =>
      form.id === "L04" ? { ...form, status: "revoked" } : form,
    );
    const { summaries } = allocateBatches(batchesOf(wang, "annual"), forms);
    expect(summaryOf(summaries, "特休（2026/4/1）")).toMatchObject({
      used: 0,
      available: 136,
    });
  });
});

describe("summarizeYear（QUOTA-05）", () => {
  it("陳志豪病假：L07 待審核 8 小時", () => {
    const forms = formsOf("E03").filter((form) => form.leaveTypeId === "sick");
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
