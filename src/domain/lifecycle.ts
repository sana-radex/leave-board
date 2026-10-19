import type { FormAction, LeaveForm, LeaveStatus } from "../types/types";

/** 一個動作的規則：誰可以做、從哪個狀態變成哪個狀態 */
interface Transition {
  /** 誰可以做：本人或該單審核人 */
  actor: "self" | "reviewer";
  /** 執行前的狀態 */
  from: LeaveStatus;
  /** 執行後的狀態 */
  to: LeaveStatus;
}

/**
 * 假單送出後的動作（規格 3.3 LIFE-02～07）
 * 已退回、已撤銷不在任何一條的 from 裡，所以是終止狀態，不能再有動作
 */
export const TRANSITIONS: Record<FormAction, Transition> = {
  approve: { actor: "reviewer", from: "pending", to: "approved" }, // LIFE-02 核准
  reject: { actor: "reviewer", from: "pending", to: "rejected" }, // LIFE-03 退回
  revoke: { actor: "self", from: "pending", to: "revoked" }, // LIFE-04 撤銷
  request_revoke: { actor: "self", from: "approved", to: "revoke_pending" }, // LIFE-05 申請撤銷
  approve_revoke: { actor: "reviewer", from: "revoke_pending", to: "revoked" }, // LIFE-06 同意撤銷
  reject_revoke: { actor: "reviewer", from: "revoke_pending", to: "approved" }, // LIFE-07 不同意撤銷
};

/** 這個人現在能不能對這張假單做這個動作：狀態對、而且是對的人 */
export function canDoAction(
  actorId: string,
  action: FormAction,
  form: LeaveForm,
): boolean {
  const transition = TRANSITIONS[action];
  if (form.status !== transition.from) {
    return false;
  }
  if (transition.actor === "self") {
    return form.employeeId === actorId;
  }
  return form.reviewerId === actorId;
}

/**
 * 執行動作：回傳新的假單（改狀態、加一筆簽核歷程），不會改到原本的假單。
 * 所有狀態變動都要經過這裡；不能做的動作直接丟錯誤。
 * 額度不用另外改：額度是依假單狀態和扣除明細即時算的。
 */
export function applyAction(
  form: LeaveForm,
  action: FormAction,
  actorId: string,
  note: string,
  at: string,
): LeaveForm {
  if (!canDoAction(actorId, action, form)) {
    throw new Error(`不能對假單 ${form.id} 執行 ${action}`);
  }
  return {
    ...form,
    status: TRANSITIONS[action].to,
    history: [...form.history, { actorId, at, action, note }],
  };
}
