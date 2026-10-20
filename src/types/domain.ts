/** 角色 */
export type Role = "submitter" | "reviewer"; // 提交人、審核人

/** 假別 id */
export type LeaveTypeId =
  | "annual" // 特休
  | "flex" // 彈性假
  | "birthday" // 生日假
  | "personal" // 事假
  | "sick" // 病假
  | "marriage" // 婚假
  | "bereavement"; // 喪假

/** 請假單位 */
export type LeaveUnit = "half_hour" | "day"; // 0.5 小時制、天制

/** 額度類型 */
export type QuotaType = "batch" | "yearly" | "per_event"; // 批次型、曆年制、單次事件

/** 假單狀態 */
export type LeaveStatus =
  | "pending" // 待審核
  | "approved" // 已核准
  | "revoke_pending" // 撤銷審核中
  | "rejected" // 已退回
  | "revoked"; // 已撤銷

/** 簽核動作 */
export type LeaveAction =
  | "submit" // 送出
  | "approve" // 核准
  | "reject" // 退回
  | "revoke" // 撤銷
  | "request_revoke" // 申請撤銷
  | "approve_revoke" // 同意撤銷
  | "reject_revoke"; // 不同意撤銷

/** 假單送出後可以做的動作（送出不算） */
export type FormAction = Exclude<LeaveAction, "submit">;

/** 目前使用者和某張假單的關係 */
export type ViewerRelation = "self" | "reviewer" | "other"; // 本人、該單審核人、其他人

/** 辦公日曆的日子類型 */
export type CalendarDayType = "holiday" | "makeup_workday"; // 放假日、補班日

/** 班別（時間都是 'HH:mm'） */
export interface Shift {
  /** 班別 id */
  id: string;
  /** 班別名稱 */
  name: string;
  /** 可選時間範圍：開始 */
  selectableStart: string;
  /** 可選時間範圍：結束 */
  selectableEnd: string;
  /** 整天區間：開始 */
  fullDayStart: string;
  /** 整天區間：結束 */
  fullDayEnd: string;
  /** 休息時間：開始 */
  breakStart: string;
  /** 休息時間：結束 */
  breakEnd: string;
  /** 每日工時 */
  dailyHours: number;
}

/** 人員 */
export interface Employee {
  /** 人員 id */
  id: string;
  /** 姓名 */
  name: string;
  /** 角色 */
  role: Role;
  /** 班別 id */
  shiftId: string;
  /** 到職日 */
  hireDate: string; // 'YYYY-MM-DD'
  /** 生日（只用月、日） */
  birthday: string; // 'YYYY-MM-DD'
}

/** 假別 */
export interface LeaveType {
  /** 假別 id */
  id: LeaveTypeId;
  /** 假別名稱 */
  name: string;
  /** 假別說明 */
  description: string;
  /** 請假單位 */
  unit: LeaveUnit;
  /** 額度類型 */
  quotaType: QuotaType;
  /** 額度時數：事假、病假是每年，婚假是每次；批次型、喪假沒有固定值 */
  quotaHours: number | null;
}

/** 喪假的親屬關係 */
export interface BereavementRelation {
  /** 親屬關係 id */
  id: string;
  /** 親屬關係名稱 */
  name: string;
  /** 每次可請天數 */
  days: number;
}

/** 彈性假公布日 */
export interface FlexLeaveDate {
  /** 公布日 */
  date: string; // 'YYYY-MM-DD'
}

/** 假單的每日明細（只有工作天） */
export interface LeaveDay {
  /** 日期 */
  date: string; // 'YYYY-MM-DD'
  /** 當天開始時間 */
  startTime: string; // 'HH:mm'
  /** 當天結束時間 */
  endTime: string; // 'HH:mm'
  /** 當天時數 */
  hours: number;
}

/** 簽核歷程的一筆紀錄 */
export interface ApprovalRecord {
  /** 執行者 id */
  actorId: string;
  /** 時間 */
  at: string; // ISO
  /** 動作 */
  action: LeaveAction;
  /** 備註 */
  note: string;
}

/** 假單 */
export interface LeaveForm {
  /** 假單 id */
  id: string;
  /** 申請人 id */
  employeeId: string;
  /** 假別 id */
  leaveTypeId: LeaveTypeId;
  /** 喪假親屬關係 id；其他假別為 null */
  relationId: string | null;
  /** 假單狀態 */
  status: LeaveStatus;
  /** 開始時間；天制存整天區間的開始 */
  startTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 結束時間；天制存整天區間的結束 */
  endTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 每日明細 */
  days: LeaveDay[];
  /** 時數 */
  hours: number;
  /** 職務代理人 id */
  deputyId: string;
  /** 審核人 id */
  reviewerId: string;
  /** 備註 */
  note: string;
  /** 送出時間 */
  submittedAt: string; // ISO
  /** 簽核歷程 */
  history: ApprovalRecord[];
}

/** 批次分次生效的一段：從哪天起多出幾小時可請 */
export interface BatchRelease {
  /** 生效日 */
  date: string; // 'YYYY-MM-DD'
  /** 這天起多出的時數 */
  hours: number;
}

/** 批次（不儲存：依人員資料和規則即時產生） */
export interface Batch {
  /** 批次 id，例如 'annual:E03:2026-03-01'、'flex:E03:2026' */
  id: string;
  /** 假別：只有批次型假別 */
  leaveTypeId: "annual" | "flex" | "birthday";
  /** 名稱，例如「特休（2026/3/1）」「彈性假（2026 年度）」 */
  name: string;
  /** 生效日：最早可以請的那天 */
  effectiveDate: string; // 'YYYY-MM-DD'
  /** 到期日（含） */
  expiryDate: string; // 'YYYY-MM-DD'
  /** 總時數 */
  hours: number;
  /** 分次生效：特休、生日假只有生效日一段；彈性假是每個公布日一段，各 8 小時 */
  releases: BatchRelease[];
}

/** 辦公日曆的特別日子 */
export interface CalendarDay {
  /** 日期 */
  date: string; // 'YYYY-MM-DD'
  /** 類型 */
  type: CalendarDayType;
  /** 名稱 */
  name: string;
}
