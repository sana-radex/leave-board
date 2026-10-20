import type {
  Batch,
  BereavementRelation,
  LeaveForm,
  LeaveType,
} from "../types/types";
import { LEAVE_STATES } from "./leaveState";

/** 一筆批次的使用情形 */
export interface BatchSummary {
  batch: Batch;
  /** 已使用：已核准、撤銷審核中假單分配到的時數 */
  used: number;
  /** 審核中：待審核假單分配到的時數 */
  reserved: number;
  /** 可用 = 總額 − 已使用 − 審核中 */
  available: number;
}

/** 要分配的假單：只用到 id、狀態、每日明細（試算時把還沒送出的這張也放進來） */
export type AllocateForm = Pick<LeaveForm, "id" | "status" | "days">;

/** 分配不到的一個請假日：哪一天、哪張假單（只差一部分也算） */
export interface FailedDay {
  date: string; // 'YYYY-MM-DD'
  formId: string;
}

/** 分配的結果：每筆批次的使用情形，以及分配不到的請假日 */
export interface AllocateResult {
  summaries: BatchSummary[];
  /** 分配不到的請假日，依日期先後；都分配得到是空陣列 */
  failedDays: FailedDay[];
}

/**
 * 依請假日分配額度：不記扣除明細，每次都從假單重算
 * 把所有假單的每一天依請假日先後排好，逐日從「當天有效」、而且到那天為止已經生效還有剩的批次扣：
 * 到期日早的先扣，相同時生效日早的先扣，一筆不夠再扣下一筆。
 * 退回、撤銷的假單不算，等於釋放額度。
 * forms 要先篩成同一個人、同一個假別；batches 要包含已過期的，過去的請假日才分配得到
 */
export function allocateBatches(
  batches: Batch[],
  forms: AllocateForm[],
): AllocateResult {
  const summaries: BatchSummary[] = batches.map((batch) => ({
    batch,
    used: 0,
    reserved: 0,
    available: batch.hours,
  }));
  // 每天都照這個順序找批次：到期日早的先，相同時生效日早的先
  const ordered = [...summaries].sort(
    (a, b) =>
      a.batch.expiryDate.localeCompare(b.batch.expiryDate) ||
      a.batch.effectiveDate.localeCompare(b.batch.effectiveDate),
  );

  // 所有假單的每一天，帶著它算進已使用還是審核中，依請假日排好
  const days = forms
    .flatMap((form) => {
      const effect = LEAVE_STATES[form.status].quotaEffect;
      if (!effect) return [];
      return form.days.map((day) => ({ ...day, effect, formId: form.id }));
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const failedDays: FailedDay[] = [];
  for (const day of days) {
    let remaining = day.hours;
    for (const summary of ordered) {
      if (remaining === 0) break;
      const { batch } = summary;
      if (day.date < batch.effectiveDate || batch.expiryDate < day.date) {
        continue;
      }
      // 到這天為止已經生效的時數，扣掉前面的請假日已經分配的
      const released = batch.releases
        .filter((release) => release.date <= day.date)
        .reduce((total, release) => total + release.hours, 0);
      const rest = released - summary.used - summary.reserved;
      if (rest <= 0) continue;
      const take = Math.min(remaining, rest);
      summary[day.effect] += take;
      summary.available -= take;
      remaining -= take;
    }
    if (remaining > 0) {
      failedDays.push({ date: day.date, formId: day.formId });
    }
  }
  return { summaries, failedDays };
}

/**
 * 曆年制：某年度的已使用、審核中
 * 依每日明細的日期算年度，跨年假單會分別算進各年度。
 * forms 要先篩成同一個人、同一個假別
 */
export function summarizeYear(
  year: number,
  forms: LeaveForm[],
): { used: number; reserved: number } {
  const totals = { used: 0, reserved: 0 };
  for (const form of forms) {
    // 依狀態決定算進已使用還是審核中；不算的（退回、撤銷）直接跳過
    const effect = LEAVE_STATES[form.status].quotaEffect;
    if (!effect) continue;
    for (const day of form.days) {
      if (!day.date.startsWith(`${year}-`)) continue;
      totals[effect] += day.hours;
    }
  }
  return totals;
}

/**
 * 單次事件每次可請的時數
 * 婚假 64 小時；喪假依親屬關係（還沒選親屬時是 null）
 */
export function getPerEventHours(
  leaveType: LeaveType,
  relation: BereavementRelation | undefined,
): number | null {
  if (leaveType.id === "bereavement") {
    return relation ? relation.days * 8 : null;
  }
  return leaveType.quotaHours;
}
