import type { LeaveForm, ViewerRelation } from "../types/types";

/** 目前使用者和這張假單的關係（規格 2.2）：本人、該單審核人、其他人 */
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

/** 看不看得到假別、備註、簽核歷程（規格 2.3）：本人、該單審核人才看得到 */
export function canSeeDetail(relation: ViewerRelation): boolean {
  return relation === "self" || relation === "reviewer";
}

/**
 * 會不會出現在行事曆上（F-06）
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
