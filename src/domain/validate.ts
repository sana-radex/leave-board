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
  LeaveStatus,
  LeaveType,
  QuotaLine,
  Shift,
} from "../types/types";
import { getTimeOptions, splitLeaveDays, sumHours } from "./time";
import { addWorkdays } from "./calendar";
import {
  allocateDeductions,
  getPerEventHours,
  summarizeBatches,
  summarizeYear,
} from "./quota";
import { formatMonthDay, formatTime } from "../utils/format";

/** 驗證時需要的資料（由 API 從資料表讀出來傳進來） */
export interface ValidateContext {
  /** 今天 'YYYY-MM-DD' */
  today: string;
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
  /** 所有假單（找申請人自己的、職務代理人的） */
  forms: LeaveForm[];
}

/** 驗證結果：錯誤、提醒，以及算出來的每日明細、時數、扣除明細、額度、補請期限 */
export interface ValidateResult {
  errors: LeaveFormErrors;
  warnings: LeaveFormErrors;
  days: LeaveDay[];
  hours: number;
  deductions: Deduction[];
  quotaLines: QuotaLine[];
  retroDeadline: string | null;
}

/** 還「有效」的假單狀態：重疊、職務代理人請假中都看這三種（VAL-08、VAL-10） */
const ACTIVE_STATUSES: LeaveStatus[] = ["pending", "approved", "revoke_pending"];

/** 找出新假單和這些假單時段重疊的第一天；沒有重疊回傳 null */
function findOverlap(
  days: LeaveDay[],
  forms: LeaveForm[],
): { date: string; form: LeaveForm } | null {
  for (const day of days) {
    for (const form of forms) {
      for (const other of form.days) {
        // 同一天，而且兩段時間有交集
        if (
          other.date === day.date &&
          day.startTime < other.endTime &&
          other.startTime < day.endTime
        ) {
          return { date: day.date, form };
        }
      }
    }
  }
  return null;
}

/**
 * 送出驗證（F-02 VAL-01～10、RETRO-01）
 * 也檢查職務代理人不是自己、審核人具審核人角色且不是自己（REV-01）
 * VAL-10 職務代理人同時段請假中只提醒，放在 warnings，不擋送出
 */
export function validateLeaveForm(
  input: AddLeaveFormRequest,
  context: ValidateContext,
): ValidateResult {
  const {
    today,
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
  const warnings: LeaveFormErrors = {};
  const result: ValidateResult = {
    errors,
    warnings,
    days: [],
    hours: 0,
    deductions: [],
    quotaLines: [],
    retroDeadline: null,
  };

  // ---------- VAL-01 必填：職務代理人、審核人 ----------
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

  // ---------- VAL-01 必填：假別、喪假親屬關係 ----------
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

  // ---------- VAL-01 必填：起始、結束 ----------
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

  // ---------- VAL-04 天制假別不能帶時間 ----------
  if (isDayUnit && (input.startTime !== null || input.endTime !== null)) {
    errors.start = `${leaveType.name}只能以整天請假`;
  }

  // ---------- VAL-03 時間要在班別可選範圍內、在 30 分鐘格上 ----------
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

  // ---------- VAL-02 結束要晚於開始 ----------
  // 天制用整天區間比，等於「結束日不能早於開始日」
  const start = `${input.startDate}T${isDayUnit ? shift.fullDayStart : input.startTime}`;
  const end = `${input.endDate}T${isDayUnit ? shift.fullDayEnd : input.endTime}`;
  if (end <= start) {
    errors.end = "結束時間需晚於開始時間";
    return result;
  }

  // ---------- VAL-05 算出來的時數不能是 0 ----------
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

  const myForms = forms.filter((form) => form.employeeId === applicant.id);

  // ---------- VAL-08 和自己其他假單時段重疊 ----------
  const myActiveForms = myForms.filter((form) =>
    ACTIVE_STATUSES.includes(form.status),
  );
  const overlap = findOverlap(days, myActiveForms);
  if (overlap) {
    const typeName =
      leaveTypes.find((type) => type.id === overlap.form.leaveTypeId)?.name ??
      "";
    errors.start = `與 ${formatMonthDay(overlap.date)} ${typeName}假單時段重疊`;
  }

  // ---------- VAL-09 補請期限（RETRO-01） ----------
  if (input.startDate < today) {
    const deadline = addWorkdays(input.endDate, 5, calendarDays);
    result.retroDeadline = deadline;
    if (today > deadline && !errors.start) {
      errors.start = `已超過補請期限 ${formatMonthDay(deadline)}`;
    }
  }

  // ---------- VAL-06、VAL-07 額度 ----------
  if (leaveType.quotaType === "batch") {
    // 批次型：逐日從有效批次扣，批次是否有效看請假日（QUOTA-01～03、RETRO-03）
    const summaries = summarizeBatches(
      batches.filter((batch) => batch.leaveTypeId === leaveType.id),
      myForms,
    );
    const allocated = allocateDeductions(days, summaries);
    if (allocated.failedDate) {
      errors.quota = `${formatMonthDay(allocated.failedDate)} 沒有可用的${leaveType.name}`;
    } else {
      result.deductions = allocated.deductions;
    }

    // 可用：請假期間任一天有效的批次，可用時數加總
    const available = summaries
      .filter((summary) =>
        days.some(
          (day) =>
            summary.batch.effectiveDate <= day.date &&
            day.date <= summary.batch.expiryDate,
        ),
      )
      .reduce((total, summary) => total + summary.available, 0);
    result.quotaLines = [
      { label: "", available, remaining: available - hours },
    ];
  } else if (leaveType.quotaType === "yearly") {
    // 曆年制：依請假日所屬年度，跨年分別檢查（QUOTA-05、06）
    const sameTypeForms = myForms.filter(
      (form) => form.leaveTypeId === leaveType.id,
    );
    const years = [...new Set(days.map((day) => Number(day.date.slice(0, 4))))];
    for (const year of years) {
      const { used, reserved } = summarizeYear(year, sameTypeForms);
      const available = (leaveType.quotaHours ?? 0) - used - reserved;
      const thisHours = sumHours(
        days.filter((day) => day.date.startsWith(`${year}-`)),
      );
      const label = years.length > 1 ? `${year} 年` : "";
      result.quotaLines.push({
        label,
        available,
        remaining: available - thisHours,
      });
      if (thisHours > available && !errors.quota) {
        errors.quota = `${label}可用額度不足：可用 ${available} 小時，本次 ${thisHours} 小時`;
      }
    }
  } else {
    // 單次事件：只檢查這張不超過該次額度，不跨假單累計（QUOTA-07）
    const perEventHours = getPerEventHours(leaveType, relation);
    if (perEventHours !== null) {
      result.quotaLines = [
        { label: "", available: perEventHours, remaining: null },
      ];
      if (hours > perEventHours) {
        const name = relation
          ? `${leaveType.name}（${relation.name}）`
          : leaveType.name;
        errors.hours = `${name}每次最多 ${perEventHours / 8} 日`;
      }
    }
  }

  // ---------- VAL-10 職務代理人同時段也請假：只提醒 ----------
  if (deputy && !errors.deputyId) {
    const deputyActiveForms = forms.filter(
      (form) =>
        form.employeeId === deputy.id && ACTIVE_STATUSES.includes(form.status),
    );
    const deputyOverlap = findOverlap(days, deputyActiveForms);
    if (deputyOverlap) {
      warnings.deputyId = `${deputy.name} ${formatMonthDay(deputyOverlap.date)} 同時段請假中`;
    }
  }

  return result;
}
