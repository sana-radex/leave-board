import type { CalendarDayType, LeaveStatus, Role } from "../types/types";

/** 假單狀態 */
export const statusLabels: Record<LeaveStatus, string> = {
  pending: "待審核",
  approved: "已核准",
  revoked: "已撤銷",
};

/** 角色 */
export const roleLabels: Record<Role, string> = {
  employee: "員工",
  manager: "主管",
};

/** 辦公日曆的日子類型 */
export const calendarDayTypeLabels: Record<CalendarDayType, string> = {
  holiday: "國定假日",
  makeup_workday: "補班日",
};