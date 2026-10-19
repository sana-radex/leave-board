import { describe, it, expect } from "vitest";
import { generateBatches, getAnnualDays } from "./batch";
import { employeeList, flexLeaveDateList, leaveFormList } from "../data/mockData";
import type { Batch, Employee } from "../types/types";

const TODAY = "2026-10-19";

/** 某位人員（預設資料的 id，或自己組的人員）、某個假別的批次 */
function batchesOf(
  employeeOrId: string | Employee,
  leaveTypeId: Batch["leaveTypeId"],
) {
  const employee =
    typeof employeeOrId === "string"
      ? employeeList.find((emp) => emp.id === employeeOrId)!
      : employeeOrId;
  return generateBatches(employee, flexLeaveDateList, TODAY).filter(
    (batch) => batch.leaveTypeId === leaveTypeId,
  );
}

/** 7/1 到職的新人：借陳志豪的資料改到職日 */
const newcomer: Employee = { ...employeeList[2], hireDate: "2026-07-01" };

/** 今天有效的批次 */
function activeOn(batches: Batch[], date: string) {
  return batches.filter(
    (batch) => batch.effectiveDate <= date && date <= batch.expiryDate,
  );
}

/** 只留比對需要的欄位 */
function brief(batch: Batch) {
  return `${batch.effectiveDate}～${batch.expiryDate} ${batch.hours}h`;
}

describe("getAnnualDays：特休年資表", () => {
  it.each([
    [1, 7],
    [2, 10],
    [3, 14],
    [4, 14],
    [5, 15],
    [9, 15],
    [10, 16],
    [11, 17],
    [24, 30],
    [30, 30],
  ])("滿 %d 年 %d 天", (years, days) => {
    expect(getAnnualDays(years)).toBe(days);
  });
});

describe("特休（6.1 有效特休批次，基準日 2026/10/19）", () => {
  it("王小明：2026/4/1–2027/3/31，17 日", () => {
    expect(activeOn(batchesOf("E01", "annual"), TODAY).map(brief)).toEqual([
      "2026-04-01～2027-03-31 136h",
    ]);
  });

  it("李美玲：2026/8/31–2027/8/30，15 日", () => {
    expect(activeOn(batchesOf("E02", "annual"), TODAY).map(brief)).toEqual([
      "2026-08-31～2027-08-30 120h",
    ]);
  });

  it("李美玲 8/31 到職，滿 6 個月是 2021/2/28（LEAVE-03）", () => {
    expect(batchesOf("E02", "annual")[0].effectiveDate).toBe("2021-02-28");
  });

  it("陳志豪：規格範例的三筆批次", () => {
    expect(batchesOf("E03", "annual").map(brief)).toEqual([
      "2024-09-01～2025-02-28 24h",
      "2025-03-01～2026-02-28 56h",
      "2026-03-01～2027-02-28 80h",
    ]);
  });

  it("7/1 到職未滿 6 個月，沒有任何特休批次（2027/1/1 那筆不產生）", () => {
    expect(batchesOf(newcomer, "annual")).toEqual([]);
  });

  it("林怡君：2025/11/5 那筆有效，下一筆 2026/11/5 起 15 日", () => {
    const batches = batchesOf("E04", "annual");
    expect(activeOn(batches, TODAY).map(brief)).toEqual([
      "2025-11-05～2026-11-04 120h",
    ]);
    expect(batches[batches.length - 1].effectiveDate).toBe("2026-11-05");
    expect(batches[batches.length - 1].hours).toBe(120);
  });

  it("王小明滿 10 年那筆 16 日", () => {
    const batch = batchesOf("E01", "annual").find(
      (item) => item.effectiveDate === "2025-04-01",
    );
    expect(batch?.hours).toBe(128);
  });
});

describe("生日假（6.1 的 2026 生日假有效期間）", () => {
  it.each([
    ["E01", "2026-09-17～2026-11-17"], // 王小明 10/17
    ["E02", "2026-02-28～2026-04-30"], // 李美玲 3/31，月底規則
    ["E03", "2025-12-10～2026-02-10"], // 陳志豪 1/10，跨年
    ["E04", "2026-01-28～2026-03-28"], // 林怡君 2/29，非閏年視為 2/28
  ])("%s：%s", (employeeId, period) => {
    const batch = batchesOf(employeeId, "birthday").find(
      (item) => item.name === "生日假（2026）",
    );
    expect(`${batch?.effectiveDate}～${batch?.expiryDate}`).toBe(period);
    expect(batch?.hours).toBe(8);
  });

  it("陳志豪的 2027 年批次 2026/12/10 起（今年就生效，要產生）", () => {
    const batch = batchesOf("E03", "birthday").find(
      (item) => item.name === "生日假（2027）",
    );
    expect(`${batch?.effectiveDate}～${batch?.expiryDate}`).toBe(
      "2026-12-10～2027-02-10",
    );
  });

  it("閏年 2/29 生日照常：2028 年是 1/29～3/29", () => {
    const employee: Employee = {
      ...employeeList[3],
      hireDate: "2025-04-01",
    };
    const batch = generateBatches(employee, [], "2028-01-01").find(
      (item) => item.name === "生日假（2028）",
    );
    expect(`${batch?.effectiveDate}～${batch?.expiryDate}`).toBe(
      "2028-01-29～2028-03-29",
    );
  });
});

describe("彈性假（6.3）", () => {
  it("每個公布日一筆 1 天，隔年 2/28 到期", () => {
    expect(batchesOf("E03", "flex").map(brief)).toEqual([
      "2026-01-02～2027-02-28 8h",
      "2026-03-29～2027-02-28 8h",
      "2026-09-28～2027-02-28 8h",
      "2026-10-31～2027-02-28 8h",
      "2026-11-12～2027-02-28 8h",
    ]);
  });

  it("7/1 到職，只有 9/28、10/31、11/12（待確認 Q2）", () => {
    expect(batchesOf(newcomer, "flex").map((batch) => batch.name)).toEqual([
      "彈性假（2026/9/28）",
      "彈性假（2026/10/31）",
      "彈性假（2026/11/12）",
    ]);
  });
});

describe("預設資料扣除明細的批次 id 都產生得出來", () => {
  const allBatchIds = employeeList.flatMap((employee) =>
    generateBatches(employee, flexLeaveDateList, TODAY).map((batch) => batch.id),
  );
  const usedIds = leaveFormList.flatMap((form) =>
    form.deductions.map((item) => item.batchId),
  );

  it.each([...new Set(usedIds)])("%s", (batchId) => {
    expect(allBatchIds).toContain(batchId);
  });
});
