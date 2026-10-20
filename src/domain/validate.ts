import type {
  AddLeaveFormRequest,
  Batch,
  BereavementRelation,
  CalendarDay,
  Deduction,
  Employee,
  LeaveDay,
  LeaveForm,
  LeaveFormErrors,
  LeaveType,
  QuotaLine,
  Shift,
} from "../types/types";
import { getTimeOptions, splitLeaveDays, sumHours } from "./time";
import { QUOTA_STRATEGIES } from "./quotaStrategy";
import { formatTime } from "../utils/format";

/** 驗證時需要的資料（由 API 從資料表讀出來傳進來） */
export interface ValidateContext {
  /** 申請人 */
  applicant: Employee;
  /** 申請人的班別 */
  shift: Shift;
  /** 所有假別 */
  leaveTypes: LeaveType[];
  /** 喪假親屬關係 */
  relations: BereavementRelation[];
  /** 所有人員 */
  employees: Employee[];
  /** 辦公日曆 */
  calendarDays: CalendarDay[];
  /** 申請人的所有批次 */
  batches: Batch[];
  /** 所有假單（找申請人自己的，算額度用） */
  forms: LeaveForm[];
}

/** 驗證結果：錯誤，以及算出來的每日明細、時數、扣除明細、額度 */
export interface ValidateResult {
  errors: LeaveFormErrors;
  days: LeaveDay[];
  hours: number;
  deductions: Deduction[];
  quotaLines: QuotaLine[];
}

/**
 * 送出驗證
 * 也檢查職務代理人不是自己、審核人具審核人角色且不是自己
 */
export function validateLeaveForm(
  input: AddLeaveFormRequest,
  context: ValidateContext,
): ValidateResult {
  const {
    applicant,
    shift,
    leaveTypes,
    relations,
    employees,
    calendarDays,
    batches,
    forms,
  } = context;
  const errors: LeaveFormErrors = {};
  const result: ValidateResult = {
    errors,
    days: [],
    hours: 0,
    deductions: [],
    quotaLines: [],
  };

  // ---------- 必填：職務代理人、審核人 ----------
  const deputy = employees.find((emp) => emp.id === input.deputyId);
  if (!input.deputyId) {
    errors.deputyId = "請選擇職務代理人";
  } else if (input.deputyId === applicant.id) {
    errors.deputyId = "職務代理人不能是自己";
  } else if (!deputy) {
    errors.deputyId = "找不到這位職務代理人";
  }

  const reviewer = employees.find((emp) => emp.id === input.reviewerId);
  if (!input.reviewerId) {
    errors.reviewerId = "請選擇審核人";
  } else if (input.reviewerId === applicant.id) {
    errors.reviewerId = "審核人不能是自己";
  } else if (!reviewer || reviewer.role !== "reviewer") {
    errors.reviewerId = "請從審核人名單中選擇";
  }

  // ---------- 必填：假別、喪假親屬關係 ----------
  const leaveType = leaveTypes.find((type) => type.id === input.leaveTypeId);
  if (!leaveType) {
    errors.leaveTypeId = "請選擇假別";
    // 沒有假別就不知道怎麼檢查時間，先回傳
    return result;
  }
  const relation = relations.find((item) => item.id === input.relationId);
  if (leaveType.id === "bereavement" && !relation) {
    errors.relationId = "請選擇親屬關係";
  }

  const isDayUnit = leaveType.unit === "day";

  // ---------- 必填：起始、結束 ----------
  if (!input.startDate) {
    errors.start = "請選擇起始日期";
  } else if (!isDayUnit && !input.startTime) {
    errors.start = "請選擇起始時間";
  }
  if (!input.endDate) {
    errors.end = "請選擇結束日期";
  } else if (!isDayUnit && !input.endTime) {
    errors.end = "請選擇結束時間";
  }

  // ---------- 天制假別不能帶時間 ----------
  if (isDayUnit && (input.startTime !== null || input.endTime !== null)) {
    errors.start = `${leaveType.name}只能以整天請假`;
  }

  // ---------- 時間要在班別可選範圍內、在 30 分鐘格上 ----------
  if (!isDayUnit) {
    const timeOptions = getTimeOptions(shift);
    const message = `請選擇 ${formatTime(shift.selectableStart)}–${formatTime(shift.selectableEnd)} 之間的半點時間`;
    if (!errors.start && !timeOptions.includes(input.startTime ?? "")) {
      errors.start = message;
    }
    if (!errors.end && !timeOptions.includes(input.endTime ?? "")) {
      errors.end = message;
    }
  }

  // 起訖有錯就不用往下算
  if (errors.start || errors.end) {
    return result;
  }

  // ---------- 結束要晚於開始 ----------
  // 天制用整天區間比，等於「結束日不能早於開始日」
  const start = `${input.startDate}T${isDayUnit ? shift.fullDayStart : input.startTime}`;
  const end = `${input.endDate}T${isDayUnit ? shift.fullDayEnd : input.endTime}`;
  if (end <= start) {
    errors.end = "結束時間需晚於開始時間";
    return result;
  }

  // ---------- 算出來的時數不能是 0 ----------
  const days = splitLeaveDays({
    unit: leaveType.unit,
    startDate: input.startDate,
    startTime: isDayUnit ? null : input.startTime,
    endDate: input.endDate,
    endTime: isDayUnit ? null : input.endTime,
    shift,
    calendarDays,
  });
  const hours = sumHours(days);
  result.days = days;
  result.hours = hours;
  if (hours === 0) {
    errors.hours = "所選期間沒有工作天";
    return result;
  }

  // ---------- 額度：依額度類型交給對應的策略 ----------
  const quota = QUOTA_STRATEGIES[leaveType.quotaType].check({
    leaveType,
    relation,
    days,
    hours,
    batches,
    myForms: forms.filter((form) => form.employeeId === applicant.id),
  });
  Object.assign(errors, quota.errors);
  result.quotaLines = quota.quotaLines;
  result.deductions = quota.deductions;

  return result;
}
