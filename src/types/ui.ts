import type { LeaveStatus } from "./domain";

/** 行事曆篩選：我的假單依狀態勾選，其他人的假單（只有已核准）、辦公日曆各一個 */
export interface CalendarFilter {
  /** 我的假單：每種狀態要不要顯示 */
  mine: Record<LeaveStatus, boolean>;
  /** 其他人的假單：行事曆上只有已核准的，要不要顯示 */
  others: boolean;
  /** 國定假日 */
  holiday: boolean;
  /** 補班日 */
  makeup_workday: boolean;
}
