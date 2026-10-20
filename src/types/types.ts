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

/** 扣除明細的一筆：從哪個批次、哪一天扣了幾小時 */
export interface Deduction {
  /** 批次 id */
  batchId: string;
  /** 請假日 */
  date: string; // 'YYYY-MM-DD'
  /** 扣除時數 */
  hours: number;
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
  /** 扣除明細；非批次型假別為空陣列 */
  deductions: Deduction[];
}

/** 批次（不儲存：依人員資料和規則即時產生） */
export interface Batch {
  /** 批次 id，重算也會一樣，例如 'annual:E03:2026-03-01' */
  id: string;
  /** 假別：只有批次型假別 */
  leaveTypeId: "annual" | "flex" | "birthday";
  /** 名稱，例如「特休（2026/3/1）」 */
  name: string;
  /** 生效日 */
  effectiveDate: string; // 'YYYY-MM-DD'
  /** 到期日（含） */
  expiryDate: string; // 'YYYY-MM-DD'
  /** 總時數 */
  hours: number;
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

/** 使用者切換的選項-回傳 */
export interface UserOptionResponse {
  /** 人員 id */
  id: string;
  /** 姓名 */
  name: string;
  /** 角色 */
  role: Role;
  /** 班別名稱 */
  shiftName: string;
}

/** 每日明細-回傳 */
export interface LeaveDayResponse extends LeaveDay {
  /** 是不是整天（當天時數等於每日工時） */
  isFullDay: boolean;
}

/** 簽核歷程-回傳 */
export interface ApprovalRecordResponse {
  /** 執行者姓名 */
  actorName: string;
  /** 時間 */
  at: string; // ISO
  /** 動作 */
  action: LeaveAction;
  /** 備註 */
  note: string;
}

/** 扣除明細-回傳 */
export interface DeductionResponse {
  /** 批次名稱，例如「特休（2026/3/1）」 */
  batchName: string;
  /** 請假日 */
  date: string; // 'YYYY-MM-DD'
  /** 扣除時數 */
  hours: number;
}

/**
 * 假單-回傳（給畫面用：後端已經把 id 換成名字，也已經依關係遮蔽）
 * canSeeDetail 為 false（其他人）時：假別換成「請假」，備註、親屬關係、簽核歷程、扣除明細都不回傳
 */
export interface LeaveFormResponse {
  /** 假單 id */
  id: string;
  /** 是不是目前使用者自己的假單 */
  isMine: boolean;
  /** 目前使用者看不看得到假別、備註、簽核歷程（本人、該單審核人才看得到） */
  canSeeDetail: boolean;
  /** 申請人姓名 */
  employeeName: string;
  /** 假別名稱；其他人看到「請假」 */
  leaveTypeName: string;
  /** 請假單位；其他人為 null */
  leaveTypeUnit: LeaveUnit | null;
  /** 喪假親屬關係名稱；不是喪假或其他人為 null */
  relationName: string | null;
  /** 假單狀態 */
  status: LeaveStatus;
  /** 開始時間 */
  startTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 結束時間 */
  endTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 每日明細 */
  days: LeaveDayResponse[];
  /** 時數 */
  hours: number;
  /** 職務代理人姓名 */
  deputyName: string;
  /** 審核人姓名 */
  reviewerName: string;
  /** 備註；其他人為空字串 */
  note: string;
  /** 送出時間 */
  submittedAt: string; // ISO
  /** 簽核歷程；其他人為空陣列 */
  history: ApprovalRecordResponse[];
  /** 扣除明細；其他人為空陣列 */
  deductions: DeductionResponse[];
  /** 目前使用者現在可以做的動作（畫面依這個顯示按鈕） */
  actions: FormAction[];
}

/** 待我處理的撤銷申請-回傳 */
export interface RevokeRequestResponse extends LeaveFormResponse {
  /** 申請撤銷時間 */
  requestedAt: string; // ISO
  /** 撤銷理由 */
  reason: string;
}

/** 待我處理-回傳 */
export interface InboxResponse {
  /** 待審申請：依送出時間由舊到新 */
  pendingList: LeaveFormResponse[];
  /** 撤銷申請：依申請撤銷時間由舊到新 */
  revokeRequestList: RevokeRequestResponse[];
}

/** API 回傳格式 */
export interface Response {
  /** 成功狀態 */
  success: boolean;
  /** 要顯示給使用者看的訊息 */
  message: string;
}

/** 新增請假表單的欄位：錯誤訊息要顯示在哪個欄位下面 */
export type LeaveFormField =
  | "leaveTypeId" // 假別
  | "relationId" // 喪假親屬關係
  | "start" // 起始
  | "end" // 結束
  | "hours" // 時數
  | "deputyId" // 職務代理人
  | "reviewerId" // 審核人
  | "quota"; // 可用額度

/** 新增請假表單的錯誤訊息（或提醒）：哪個欄位、什麼訊息 */
export type LeaveFormErrors = Partial<Record<LeaveFormField, string>>;

/** 新增請假時顯示的可用額度（一行） */
export interface QuotaLine {
  /** 前面的說明，例如跨年時的「2026 年」；不需要時是空字串 */
  label: string;
  /** 可用時數；婚喪假是該次額度 */
  available: number;
  /** 送出後剩餘；婚喪假不累計，是 null */
  remaining: number | null;
}

/** 新增假單-請求 */
export interface AddLeaveFormRequest {
  /** 假別 id；還沒選是空字串 */
  leaveTypeId: LeaveTypeId | "";
  /** 喪假親屬關係 id；不是喪假或還沒選是空字串 */
  relationId: string;
  /** 起始日期 */
  startDate: string; // 'YYYY-MM-DD'
  /** 起始時間；天制為 null */
  startTime: string | null; // 'HH:mm'
  /** 結束日期 */
  endDate: string; // 'YYYY-MM-DD'
  /** 結束時間；天制為 null */
  endTime: string | null; // 'HH:mm'
  /** 職務代理人 id */
  deputyId: string;
  /** 審核人 id */
  reviewerId: string;
  /** 備註 */
  note: string;
}

/** 人員選項（下拉選單用） */
export interface EmployeeOptionResponse {
  /** 人員 id */
  id: string;
  /** 姓名 */
  name: string;
}

/** 新增請假表單的選項-回傳 */
export interface LeaveFormOptionsResponse {
  /** 申請人的班別 */
  shift: Shift;
  /** 起訖時間的選項（依班別） */
  timeOptions: string[];
  /** 假別 */
  leaveTypes: LeaveType[];
  /** 喪假親屬關係 */
  relations: BereavementRelation[];
  /** 職務代理人選項（排除自己） */
  deputies: EmployeeOptionResponse[];
  /** 審核人選項（所有審核人，排除自己） */
  reviewers: EmployeeOptionResponse[];
}

/** 新增請假試算-回傳 */
export interface LeaveFormPreviewResponse {
  /** 每日明細 */
  days: LeaveDay[];
  /** 時數 */
  hours: number;
  /** 各欄位的錯誤訊息（會擋送出） */
  errors: LeaveFormErrors;
  /** 可用額度 */
  quotaLines: QuotaLine[];
  /** 將扣的批次 */
  deductions: DeductionResponse[];
}

/** 送出假單-回傳 */
export interface AddLeaveFormResponse extends Response {
  /** 各欄位的錯誤訊息 */
  errors: LeaveFormErrors;
}

/** 批次的狀態：有效中、尚未生效（已過期的不回傳） */
export type BatchStatus = "active" | "upcoming";

/** 我的額度：一筆批次-回傳 */
export interface BatchQuotaResponse {
  /** 批次 id */
  id: string;
  /** 名稱，例如「特休（2026/3/1）」 */
  name: string;
  /** 生效日 */
  effectiveDate: string; // 'YYYY-MM-DD'
  /** 到期日 */
  expiryDate: string; // 'YYYY-MM-DD'
  /** 總額 */
  total: number;
  /** 已使用 */
  used: number;
  /** 審核中 */
  reserved: number;
  /** 可用 */
  available: number;
  /** 有效中、尚未生效 */
  status: BatchStatus;
  /** 30 天內到期且還有可用時數 */
  expiringSoon: boolean;
  /** 已請（審核中或已使用）；彈性假標示用 */
  isTaken: boolean;
}

/** 我的額度：單次事件的每次額度-回傳 */
export interface PerEventQuotaResponse {
  /** 說明：喪假是親屬，例如「父母、養父母、繼父母、配偶」；婚假是空字串 */
  label: string;
  /** 每次可請時數 */
  hours: number;
}

/** 我的額度：一個假別-回傳 */
export interface LeaveQuotaResponse {
  /** 假別 id */
  leaveTypeId: LeaveTypeId;
  /** 假別名稱 */
  leaveTypeName: string;
  /** 假別說明，例如「每年 14 日」 */
  leaveTypeDescription: string;
  /** 額度類型 */
  quotaType: QuotaType;
  /** 總額：批次型是有效中＋尚未生效批次的加總；曆年制是今年度 */
  total: number;
  /** 已使用 */
  used: number;
  /** 審核中 */
  reserved: number;
  /** 可用 */
  available: number;
  /** 批次型的有效中、尚未生效批次（不含已過期）；其他假別是空陣列 */
  batches: BatchQuotaResponse[];
  /** 單次事件的每次額度；其他假別是空陣列 */
  perEvent: PerEventQuotaResponse[];
}
