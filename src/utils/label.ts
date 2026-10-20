import type {
  CalendarDayType,
  FormAction,
  LeaveAction,
  LeaveStatus,
  Role,
} from "../types/domain";

/** 假單狀態 */
export const STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "待審核",
  approved: "已核准",
  revoke_pending: "撤銷審核中",
  rejected: "已退回",
  revoked: "已撤銷",
};

/** 行事曆標籤後的狀態加註：已核准不加註 */
export const CALENDAR_NOTES: Record<LeaveStatus, string> = {
  pending: "（待審核）",
  approved: "",
  revoke_pending: "（撤銷審核中）",
  rejected: "（已退回）",
  revoked: "（已撤銷）",
};

/** 簽核動作 */
export const ACTION_LABELS: Record<LeaveAction, string> = {
  submit: "送出",
  approve: "核准",
  reject: "退回",
  revoke: "撤銷",
  request_revoke: "申請撤銷",
  approve_revoke: "同意撤銷",
  reject_revoke: "不同意撤銷",
};

/** 假單動作成功後的訊息 */
export const ACTION_DONE_MESSAGES: Record<FormAction, string> = {
  approve: "已核准",
  reject: "已退回",
  revoke: "已撤銷",
  request_revoke: "已送出撤銷申請",
  approve_revoke: "已同意撤銷申請",
  reject_revoke: "已駁回撤銷申請",
};

/** 角色 */
export const ROLE_LABELS: Record<Role, string> = {
  submitter: "提交人",
  reviewer: "審核人",
};

/** 辦公日曆的日子類型 */
export const CALENDAR_DAY_TYPE_LABELS: Record<CalendarDayType, string> = {
  holiday: "國定假日",
  makeup_workday: "補班日",
};
