import type { FormAction, LeaveForm, ViewerRelation } from "../types/types";
import { TRANSITIONS, canDoAction } from "./lifecycle";

/** 目前使用者和這張假單的關係：本人、該單審核人、其他人 */
export function getViewerRelation(
  viewerId: string,
  form: LeaveForm,
): ViewerRelation {
  if (form.employeeId === viewerId) {
    return "self";
  }
  if (form.reviewerId === viewerId) {
    return "reviewer";
  }
  return "other";
}

/** 看不看得到假別、備註、簽核歷程：本人、該單審核人才看得到 */
export function canSeeDetail(relation: ViewerRelation): boolean {
  return relation === "self" || relation === "reviewer";
}

/**
 * 目前使用者對這張假單可以做哪些動作
 * 畫面只依這個結果顯示按鈕，不自己判斷角色或狀態
 */
export function getAvailableActions(
  viewerId: string,
  form: LeaveForm,
): FormAction[] {
  const allActions = Object.keys(TRANSITIONS) as FormAction[];
  return allActions.filter((action) => canDoAction(viewerId, action, form));
}

/**
 * 會不會出現在行事曆上
 * - 已核准、撤銷審核中：會
 * - 已撤銷：曾核准過才會（簽核歷程裡有「核准」）
 * - 待審核、已退回：不會
 */
export function isOnCalendar(form: LeaveForm): boolean {
  if (form.status === "approved" || form.status === "revoke_pending") {
    return true;
  }
  if (form.status === "revoked") {
    return form.history.some((record) => record.action === "approve");
  }
  return false;
}
