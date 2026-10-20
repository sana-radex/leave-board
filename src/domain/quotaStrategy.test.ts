import { describe, it, expect } from "vitest";
import { QUOTA_STRATEGIES } from "./quotaStrategy";
import type { QuotaSummaryInput } from "./quotaStrategy";
import { generateBatches } from "./batch";
import {
  employeeList,
  flexLeaveDateList,
  leaveFormList,
  leaveTypeList,
} from "../data/mockData";
import type { Employee, LeaveTypeId } from "../types/domain";

/** 今天：2026/10/19（基準日） */
const TODAY = "2026-10-19";

/** 某位人員某個假別的「我的額度」 */
function summarizeOf(employee: Employee, leaveTypeId: LeaveTypeId) {
  const leaveType = leaveTypeList.find((type) => type.id === leaveTypeId)!;
  const input: QuotaSummaryInput = {
    leaveType,
    batches: generateBatches(employee, flexLeaveDateList, TODAY),
    myForms: leaveFormList.filter((form) => form.employeeId === employee.id),
    today: TODAY,
  };
  return QUOTA_STRATEGIES[leaveType.quotaType].summarize(input);
}

const lee = employeeList[1]; // 李美玲
const chen = employeeList[2]; // 陳志豪
const lin = employeeList[3]; // 林怡君

describe("批次型的我的額度", () => {
  it("陳志豪彈性假：2026 年度一筆 5 天，L08 預留 2 天；10/31、11/12 還沒公布", () => {
    const quota = summarizeOf(chen, "flex");
    expect(quota).toMatchObject({
      total: 40,
      used: 0,
      reserved: 16,
      available: 24,
    });
    expect(
      quota.batches.map(({ name, status, upcomingReleases }) => ({
        name,
        status,
        upcomingReleases,
      })),
    ).toEqual([
      {
        name: "彈性假（2026 年度）",
        status: "active",
        upcomingReleases: [
          { date: "2026-10-31", hours: 8 },
          { date: "2026-11-12", hours: 8 },
        ],
      },
    ]);
  });

  it("過了 2/28 前一年度不顯示；2/10 的假算在前一年度，2027 年度不受影響", () => {
    const flex = leaveTypeList.find((type) => type.id === "flex")!;
    const quota = QUOTA_STRATEGIES.batch.summarize({
      leaveType: flex,
      batches: generateBatches(
        chen,
        [...flexLeaveDateList, { date: "2027-01-04" }],
        "2027-03-01",
      ),
      myForms: [
        {
          ...leaveFormList.find((form) => form.id === "L08")!,
          status: "approved",
          days: [
            { date: "2027-02-10", startTime: "09:00", endTime: "18:00", hours: 8 },
          ],
        },
      ],
      today: "2027-03-01",
    });
    expect(quota.batches.map(({ name, used }) => ({ name, used }))).toEqual([
      { name: "彈性假（2027 年度）", used: 0 },
    ]);
  });

  it("林怡君特休：2025/11/5 批次 11/4 到期，30 天內到期；下一筆尚未生效不提示", () => {
    const quota = summarizeOf(lin, "annual");
    expect(
      quota.batches.map(({ id, status, available, expiringSoon }) => ({
        id,
        status,
        available,
        expiringSoon,
      })),
    ).toEqual([
      {
        id: "annual:E04:2025-11-05",
        status: "active",
        available: 112,
        expiringSoon: true,
      },
      {
        id: "annual:E04:2026-11-05",
        status: "upcoming",
        available: 112,
        expiringSoon: false,
      },
    ]);
  });

  it("李美玲生日假：2026 批次已過期不顯示，2027 批次還沒產生", () => {
    const quota = summarizeOf(lee, "birthday");
    expect(quota.batches).toEqual([]);
    expect(quota.total).toBe(0);
  });
});

describe("曆年制的我的額度", () => {
  it("陳志豪病假：每年 240 小時，L07 待審核 8 小時", () => {
    expect(summarizeOf(chen, "sick")).toEqual({
      total: 240,
      used: 0,
      reserved: 8,
      available: 232,
      batches: [],
    });
  });

  it("林怡君事假：L06 已撤銷不算", () => {
    expect(summarizeOf(lin, "personal")).toMatchObject({
      total: 112,
      used: 0,
      reserved: 0,
      available: 112,
    });
  });
});

describe("單次事件的我的額度", () => {
  it("李美玲喪假：不跨假單累計，L11 待審核也不算，數字都是 0", () => {
    expect(summarizeOf(lee, "bereavement")).toEqual({
      total: 0,
      used: 0,
      reserved: 0,
      available: 0,
      batches: [],
    });
  });
});
