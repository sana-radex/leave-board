import { describe, it, expect } from "vitest";
import type { FormAction, LeaveStatus } from "../types/domain";
import { LEAVE_STATES } from "./leaveState";

/** 所有假單狀態 */
const STATUSES = Object.keys(LEAVE_STATES) as LeaveStatus[];

/** 所有送出後的動作：用 Record 列，新增動作時這裡沒補會編譯不過 */
const ALL_ACTIONS = Object.keys({
  approve: true,
  reject: true,
  revoke: true,
  request_revoke: true,
  approve_revoke: true,
  reject_revoke: true,
} satisfies Record<FormAction, true>) as FormAction[];

describe("LEAVE_STATES：狀態之間的規則", () => {
  it("已退回、已撤銷是終止狀態，沒有任何動作", () => {
    expect(LEAVE_STATES.rejected.transitions).toEqual({});
    expect(LEAVE_STATES.revoked.transitions).toEqual({});
  });

  it("每個動作剛好屬於一個狀態", () => {
    for (const action of ALL_ACTIONS) {
      const owners = STATUSES.filter(
        (status) => LEAVE_STATES[status].transitions[action],
      );
      expect(owners, action).toHaveLength(1);
    }
  });

  it("從待審核出發，沿著動作走得到每一個狀態", () => {
    const reached: LeaveStatus[] = ["pending"];
    // 邊走邊把新走到的狀態加進 reached，for...of 會繼續走到新加的
    for (const status of reached) {
      for (const transition of Object.values(LEAVE_STATES[status].transitions)) {
        if (transition && !reached.includes(transition.to)) {
          reached.push(transition.to);
        }
      }
    }
    expect([...reached].sort()).toEqual([...STATUSES].sort());
  });

  it("在待我處理裡的狀態，剛好是審核人有動作可做的狀態", () => {
    for (const status of STATUSES) {
      const state = LEAVE_STATES[status];
      const reviewerCanAct = Object.values(state.transitions).some(
        (transition) => transition?.actor === "reviewer",
      );
      expect(state.inboxGroup !== null, status).toBe(reviewerCanAct);
    }
  });

  it("其他人看得到的，剛好是額度算已使用的狀態（假確定有效），而且都看成已核准", () => {
    for (const status of STATUSES) {
      const state = LEAVE_STATES[status];
      expect(state.othersSeeAs !== null, status).toBe(
        state.quotaEffect === "used",
      );
      expect([null, "approved"], status).toContain(state.othersSeeAs);
    }
  });
});
