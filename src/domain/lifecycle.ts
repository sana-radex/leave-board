import type { FormAction, LeaveForm } from "../types/types";
import { LEAVE_STATES } from "./leaveState";
import type { Transition } from "./leaveState";

/** 本人、該單審核人在假單上各是哪個人 */
const ACTOR_IDS: Record<Transition["actor"], (form: LeaveForm) => string> = {
  self: (form) => form.employeeId,
  reviewer: (form) => form.reviewerId,
};

/**
 * 找出這個人現在對這張假單做這個動作的規則
 * 目前狀態沒有這個動作，或不是對的人，就是 null（已退回、已撤銷沒有任何動作）
 */
function findAllowedTransition(
  actorId: string,
  action: FormAction,
  form: LeaveForm,
): Transition | null {
  const transition = LEAVE_STATES[form.status].transitions[action];
  if (!transition || ACTOR_IDS[transition.actor](form) !== actorId) {
    return null;
  }
  return transition;
}

/** 這個人現在能不能對這張假單做這個動作：目前狀態有這個動作、而且是對的人 */
export function canDoAction(
  actorId: string,
  action: FormAction,
  form: LeaveForm,
): boolean {
  return findAllowedTransition(actorId, action, form) !== null;
}

/**
 * 執行動作：回傳新的假單（改狀態、加一筆簽核歷程），不會改到原本的假單。
 * 所有狀態變動都要經過這裡；不能做的動作直接丟錯誤。
 * 額度不用另外改：額度是依假單狀態和請假日即時算的。
 */
export function applyAction(
  form: LeaveForm,
  action: FormAction,
  actorId: string,
  note: string,
  at: string,
): LeaveForm {
  const transition = findAllowedTransition(actorId, action, form);
  if (!transition) {
    throw new Error(`不能對假單 ${form.id} 執行 ${action}`);
  }
  return {
    ...form,
    status: transition.to,
    history: [...form.history, { actorId, at, action, note }],
  };
}
