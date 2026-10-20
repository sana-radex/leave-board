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
