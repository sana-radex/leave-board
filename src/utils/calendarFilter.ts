import type { LeaveStatus } from "../types/domain";
import type { CalendarFilter } from "../types/ui";

/** 全部顯示的篩選條件：行事曆的預設值、篩選視窗的「全部顯示」都用這個 */
export function createShowAllFilter(): CalendarFilter {
  const allStatuses: Record<LeaveStatus, boolean> = {
    pending: true,
    approved: true,
    revoke_pending: true,
    rejected: true,
    revoked: true,
  };
  return {
    mine: allStatuses,
    others: true,
    holiday: true,
    makeup_workday: true,
  };
}
