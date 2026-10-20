import type {
  Batch,
  BereavementRelation,
  Deduction,
  LeaveDay,
  LeaveForm,
  LeaveType,
} from "../types/types";
import { LEAVE_STATES } from "./leaveState";

/** 一筆批次的使用情形 */
export interface BatchSummary {
  batch: Batch;
  /** 已使用：已核准、撤銷審核中假單扣的時數 */
  used: number;
  /** 審核中：待審核假單預留的時數 */
  reserved: number;
  /** 可用 = 總額 − 已使用 − 審核中 */
  available: number;
}

/**
 * 每筆批次的已使用、審核中、可用
 * 依假單的扣除明細和狀態即時加總；退回、撤銷的假單不算，等於退回原批次
 */
export function summarizeBatches(
  batches: Batch[],
  forms: LeaveForm[],
): BatchSummary[] {
  return batches.map((batch) => {
    const totals = { used: 0, reserved: 0 };
    for (const form of forms) {
      // 依狀態決定算進已使用還是審核中；不算的（退回、撤銷）直接跳過
      const effect = LEAVE_STATES[form.status].quotaEffect;
      if (!effect) continue;
      for (const item of form.deductions) {
        if (item.batchId !== batch.id) continue;
        totals[effect] += item.hours;
      }
    }
    const { used, reserved } = totals;
    return { batch, used, reserved, available: batch.hours - used - reserved };
  });
}

/** 逐日扣除的結果：成功就有扣除明細；有一天扣不到就回傳那一天 */
export interface AllocateResult {
  deductions: Deduction[];
  failedDate: string | null;
}

/**
 * 逐日扣除
 * 每個請假日，從「當天有效」且還有可用時數的批次中，到期日早的先扣，
 * 到期日相同時生效日早的先扣，一筆不夠再扣下一筆。
 * 任何一天扣不到，整張假單不能送出（不自動拆單）
 */
export function allocateDeductions(
  days: LeaveDay[],
  summaries: BatchSummary[],
): AllocateResult {
  const available = new Map<string, number>();
  for (const summary of summaries) {
    available.set(summary.batch.id, summary.available);
  }

  const deductions: Deduction[] = [];
  for (const day of days) {
    const candidates = summaries
      .map((summary) => summary.batch)
      .filter(
        (batch) =>
          batch.effectiveDate <= day.date &&
          day.date <= batch.expiryDate &&
          (available.get(batch.id) ?? 0) > 0,
      )
      .sort(
        (a, b) =>
          a.expiryDate.localeCompare(b.expiryDate) ||
          a.effectiveDate.localeCompare(b.effectiveDate),
      );

    let remaining = day.hours;
    for (const batch of candidates) {
      if (remaining === 0) break;
      const rest = available.get(batch.id) ?? 0;
      const take = Math.min(remaining, rest);
      deductions.push({ batchId: batch.id, date: day.date, hours: take });
      available.set(batch.id, rest - take);
      remaining -= take;
    }

    if (remaining > 0) {
      return { deductions: [], failedDate: day.date };
    }
  }
  return { deductions, failedDate: null };
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
