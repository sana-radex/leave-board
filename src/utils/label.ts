import type {
  CalendarDayType,
  LeaveAction,
  LeaveStatus,
  Role,
} from "../types/types";

/** 假單狀態 */
export const statusLabels: Record<LeaveStatus, string> = {
  pending: "待審核",
  approved: "已核准",
  revoke_pending: "撤銷審核中",
  rejected: "已退回",
  revoked: "已撤銷",
};

/** 簽核動作 */
export const actionLabels: Record<LeaveAction, string> = {
  submit: "送出",
  approve: "核准",
  reject: "退回",
  revoke: "撤銷",
  request_revoke: "申請撤銷",
  approve_revoke: "同意撤銷",
  reject_revoke: "不同意撤銷",
};

/** 角色 */
export const roleLabels: Record<Role, string> = {
  submitter: "提交人",
  reviewer: "審核人",
};

/** 辦公日曆的日子類型 */
export const calendarDayTypeLabels: Record<CalendarDayType, string> = {
  holiday: "國定假日",
  makeup_workday: "補班日",
};
