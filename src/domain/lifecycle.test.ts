import { describe, it, expect } from "vitest";
import { applyAction, canDoAction } from "./lifecycle";
import { leaveFormList } from "../data/mockData";

/** 從預設資料拿出某張假單 */
function getForm(id: string) {
  const form = leaveFormList.find((item) => item.id === id);
  if (!form) {
    throw new Error(`預設資料沒有 ${id}`);
  }
  return form;
}

const AT = "2026-10-19T03:00:00.000Z";

describe("applyAction：合法的動作（規格 3.3）", () => {
  it("LIFE-02 核准：待審核 → 已核准", () => {
    const result = applyAction(getForm("L08"), "approve", "E01", "", AT);
    expect(result.status).toBe("approved");
  });

  it("LIFE-03 退回：待審核 → 已退回，備註記在歷程", () => {
    const result = applyAction(getForm("L11"), "reject", "E01", "請補證明", AT);
    expect(result.status).toBe("rejected");
    expect(result.history[result.history.length - 1]).toEqual({
      actorId: "E01",
      at: AT,
      action: "reject",
      note: "請補證明",
    });
  });

  it("LIFE-04 撤銷：待審核 → 已撤銷（本人）", () => {
    const result = applyAction(getForm("L08"), "revoke", "E03", "", AT);
    expect(result.status).toBe("revoked");
  });

  it("LIFE-05 申請撤銷：已核准 → 撤銷審核中（本人）", () => {
    const result = applyAction(getForm("L01"), "request_revoke", "E03", "行程改了", AT);
    expect(result.status).toBe("revoke_pending");
  });

  it("LIFE-06 同意撤銷：撤銷審核中 → 已撤銷（該單審核人）", () => {
    const result = applyAction(getForm("L04"), "approve_revoke", "E02", "", AT);
    expect(result.status).toBe("revoked");
  });

  it("LIFE-07 不同意撤銷：撤銷審核中 → 已核准，可以再申請撤銷", () => {
    const back = applyAction(getForm("L04"), "reject_revoke", "E02", "", AT);
    expect(back.status).toBe("approved");
    const again = applyAction(back, "request_revoke", "E01", "", AT);
    expect(again.status).toBe("revoke_pending");
  });

  it("每個動作都加一筆歷程，原本的假單不變", () => {
    const form = getForm("L08");
    const result = applyAction(form, "approve", "E01", "", AT);
    expect(result.history).toHaveLength(form.history.length + 1);
    expect(form.status).toBe("pending");
  });
});

describe("applyAction：不能做的動作會丟錯誤", () => {
  it("狀態不對：已核准的不能再核准", () => {
    expect(() => applyAction(getForm("L01"), "approve", "E01", "", AT)).toThrow();
  });

  it("其他審核人不能核准（李美玲不能核准 L08）", () => {
    expect(() => applyAction(getForm("L08"), "approve", "E02", "", AT)).toThrow();
  });

  it("本人不能核准自己的假單", () => {
    expect(() => applyAction(getForm("L08"), "approve", "E03", "", AT)).toThrow();
  });

  it("審核人不能撤銷別人的假單", () => {
    expect(() => applyAction(getForm("L08"), "revoke", "E01", "", AT)).toThrow();
  });
});

describe("canDoAction：終止狀態不能再有任何動作", () => {
  const actions = [
    "approve",
    "reject",
    "revoke",
    "request_revoke",
    "approve_revoke",
    "reject_revoke",
  ] as const;

  it.each(["L03", "L05", "L06"])("%s（已退回或已撤銷）", (id) => {
    const form = getForm(id);
    for (const action of actions) {
      expect(canDoAction(form.employeeId, action, form)).toBe(false);
      expect(canDoAction(form.reviewerId, action, form)).toBe(false);
    }
  });
});
