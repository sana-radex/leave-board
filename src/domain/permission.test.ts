import { describe, it, expect } from "vitest";
import { getViewerRelation, canSeeDetail, isOnCalendar } from "./permission";
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
    // L01 的職務代理人是張家豪
    expect(getViewerRelation("E05", getForm("L01"))).toBe("other");
  });
});

describe("canSeeDetail", () => {
  it("本人、該單審核人看得到，其他人看不到", () => {
    expect(canSeeDetail("self")).toBe(true);
    expect(canSeeDetail("reviewer")).toBe(true);
    expect(canSeeDetail("other")).toBe(false);
  });
});

describe("isOnCalendar", () => {
  it("已核准、撤銷審核中會出現", () => {
    expect(isOnCalendar(getForm("L01"))).toBe(true);
    expect(isOnCalendar(getForm("L04"))).toBe(true);
  });

  it("曾核准過的已撤銷會出現（L05）", () => {
    expect(isOnCalendar(getForm("L05"))).toBe(true);
  });

  it("待審核時撤銷的不會出現（L06）", () => {
    expect(isOnCalendar(getForm("L06"))).toBe(false);
  });

  it("已退回、待審核不會出現", () => {
    expect(isOnCalendar(getForm("L03"))).toBe(false);
    expect(isOnCalendar(getForm("L07"))).toBe(false);
  });

  it("10 月行事曆是 L01、L02、L04、L05，11 月是 L10（6.5）", () => {
    const ids = leaveFormList.filter(isOnCalendar).map((form) => form.id);
    expect(ids).toEqual(["L01", "L02", "L04", "L05", "L10"]);
  });
});
