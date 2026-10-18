import type { LeaveStatus, Role } from "../types/types";

/** 假單狀態 */
export const statusLabels: Record<LeaveStatus, string> = {
  pending: "待審核",
  approved: "已核准",
  revoked: "已撤銷",
};

/** 角色 */
export const roleLabels: Record<Role, string> = {
  general_manager: "總經理",
  manager: "主管",
  employee: "員工",
};