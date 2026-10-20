import { describe, it, expect } from "vitest";
import {
  getViewerRelation,
  canSeeDetail,
  getAvailableActions,
} from "./permission";
import { leaveFormList } from "../data/mockData";

/** 從預設資料拿出某張假單 */
function getForm(id: string) {
  const form = leaveFormList.find((item) => item.id === id);
  if (!form) {
    throw new Error(`預設資料沒有 ${id}`);
  }
  return form;
}

describe("getViewerRelation", () => {
  it("L01：陳志豪是本人、王小明是該單審核人、李美玲是其他人", () => {
    const form = getForm("L01");
    expect(getViewerRelation("E03", form)).toBe("self");
    expect(getViewerRelation("E01", form)).toBe("reviewer");
    expect(getViewerRelation("E02", form)).toBe("other");
  });

  it("L04：李美玲同時是職務代理人與審核人，算該單審核人", () => {
    expect(getViewerRelation("E02", getForm("L04"))).toBe("reviewer");
  });

  it("職務代理人不算本人或審核人", () => {
    // L01 的職務代理人是林怡君
    expect(getViewerRelation("E04", getForm("L01"))).toBe("other");
  });
});

describe("canSeeDetail", () => {
  it("本人、該單審核人看得到，其他人看不到", () => {
    expect(canSeeDetail("self")).toBe(true);
    expect(canSeeDetail("reviewer")).toBe(true);
    expect(canSeeDetail("other")).toBe(false);
  });
});

describe("getAvailableActions（規格 2.3 權限總表）", () => {
  it("待審核 L08：本人可撤銷、該單審核人可核准／退回、其他審核人什麼都不能做", () => {
    const form = getForm("L08");
    expect(getAvailableActions("E03", form)).toEqual(["revoke"]);
    expect(getAvailableActions("E01", form)).toEqual(["approve", "reject"]);
    expect(getAvailableActions("E02", form)).toEqual([]);
  });

  it("已核准 L01：本人可申請撤銷、審核人什麼都不能做", () => {
    const form = getForm("L01");
    expect(getAvailableActions("E03", form)).toEqual(["request_revoke"]);
    expect(getAvailableActions("E01", form)).toEqual([]);
  });

  it("撤銷審核中 L04：原審核人可同意／不同意撤銷，本人等待（REVOKE-04）", () => {
    const form = getForm("L04");
    expect(getAvailableActions("E02", form)).toEqual([
      "approve_revoke",
      "reject_revoke",
    ]);
    expect(getAvailableActions("E01", form)).toEqual([]);
  });

  it("假期已過仍可申請撤銷（REVOKE-02）", () => {
    const past = {
      ...getForm("L02"),
      startTime: "2026-10-01T13:00",
      endTime: "2026-10-01T17:00",
    };
    expect(getAvailableActions("E04", past)).toEqual(["request_revoke"]);
  });

  it("職務代理人不能做任何動作", () => {
    // L01 的職務代理人是林怡君
    expect(getAvailableActions("E04", getForm("L01"))).toEqual([]);
  });
});
