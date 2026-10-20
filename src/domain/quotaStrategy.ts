import type {
  Batch,
  BatchQuotaResponse,
  BatchStatus,
  BereavementRelation,
  LeaveDay,
  LeaveForm,
  LeaveFormErrors,
  LeaveQuotaResponse,
  LeaveType,
  QuotaLine,
  QuotaType,
} from "../types/types";
import { allocateBatches, getPerEventHours, summarizeYear } from "./quota";
import { sumHours } from "./time";
import { addDays } from "./date";
import { formatMonthDay } from "../utils/format";

/** 送出時檢查額度需要的資料 */
export interface QuotaCheckInput {
  /** 假別 */
  leaveType: LeaveType;
  /** 喪假親屬關係；其他假別或還沒選是 undefined */
  relation: BereavementRelation | undefined;
  /** 這張假單的每日明細 */
  days: LeaveDay[];
  /** 這張假單的時數 */
  hours: number;
  /** 申請人的所有批次 */
  batches: Batch[];
  /** 申請人的所有假單 */
  myForms: LeaveForm[];
}

/** 送出時檢查額度的結果 */
export interface QuotaCheckResult {
  /** 錯誤：批次型、曆年制放在可用額度，單次事件放在時數 */
  errors: LeaveFormErrors;
  /** 可用額度 */
  quotaLines: QuotaLine[];
}

/** 我的額度需要的資料 */
export interface QuotaSummaryInput {
  /** 假別 */
  leaveType: LeaveType;
  /** 目前使用者的所有批次 */
  batches: Batch[];
  /** 目前使用者的所有假單 */
  myForms: LeaveForm[];
  /** 今天 */
  today: string; // 'YYYY-MM-DD'
}

/** 我的額度的數字：假別 id、名稱等基本資料由呼叫端補上 */
export type QuotaSummary = Pick<
  LeaveQuotaResponse,
  "total" | "used" | "reserved" | "available" | "batches"
>;

/** 一種額度類型的規則：要知道某種額度怎麼檢查、怎麼算，看這裡就好，不用到各處找 if */
export interface QuotaStrategy {
  /** 送出時檢查額度 */
  check: (input: QuotaCheckInput) => QuotaCheckResult;
  /** 我的額度：總額、已使用、審核中、可用、批次 */
  summarize: (input: QuotaSummaryInput) => QuotaSummary;
}

/** 試算時還沒送出的這張假單，分配時用這個 id 認出它 */
const NEW_FORM_ID = "new";

/** 批次型：特休、彈性假、生日假 */
const batchStrategy: QuotaStrategy = {
  check({ leaveType, days, hours, batches, myForms }) {
    const typeBatches = batches.filter(
      (batch) => batch.leaveTypeId === leaveType.id,
    );
    const sameTypeForms = myForms.filter(
      (form) => form.leaveTypeId === leaveType.id,
    );

    // 可用（不含這張）：請假期間任一天有效的批次，可用時數加總
    const before = allocateBatches(typeBatches, sameTypeForms);
    const available = before.summaries
      .filter((summary) =>
        days.some(
          (day) =>
            summary.batch.effectiveDate <= day.date &&
            day.date <= summary.batch.expiryDate,
        ),
      )
      .reduce((total, summary) => total + summary.available, 0);

    // 把這張也放進去，依請假日先後重新分配一次，有一天分配不到就擋
    const after = allocateBatches(typeBatches, [
      ...sameTypeForms,
      { id: NEW_FORM_ID, status: "pending", days },
    ]);
    // 這張自己分配不到的那天
    const ownFailed = after.failedDays.find(
      (item) => item.formId === NEW_FORM_ID,
    );
    // 這張插在前面，讓自己之後原本夠的其他假單變得不夠
    const othersFailed = after.failedDays.find(
      (item) =>
        item.formId !== NEW_FORM_ID &&
        !before.failedDays.some(
          (old) => old.formId === item.formId && old.date === item.date,
        ),
    );
    const errors: LeaveFormErrors = {};
    if (ownFailed) {
      errors.quota = `${formatMonthDay(ownFailed.date)} 沒有可用的${leaveType.name}`;
    } else if (othersFailed) {
      errors.quota = `請這張之後，${formatMonthDay(othersFailed.date)} 的${leaveType.name}會不夠`;
    }
    return {
      errors,
      quotaLines: [{ label: "", available, remaining: available - hours }],
    };
  },

  summarize({ leaveType, batches, myForms, today }) {
    // 用全部批次分配（含已過期），過去的請假日才會落在當時的批次上
    const { summaries } = allocateBatches(
      batches.filter((batch) => batch.leaveTypeId === leaveType.id),
      myForms.filter((form) => form.leaveTypeId === leaveType.id),
    );
    // 30 天內到期：到期日不晚於今天 + 30 天
    const soonDate = addDays(today, 30);
    // 已過期批次不計算也不顯示：只留有效中＋尚未生效（到期日不早於今天）
    const batchResponses: BatchQuotaResponse[] = summaries
      .filter(({ batch }) => batch.expiryDate >= today)
      .map(({ batch, used, reserved, available }) => {
        const status: BatchStatus =
          batch.effectiveDate > today ? "upcoming" : "active";
        return {
          id: batch.id,
          name: batch.name,
          effectiveDate: batch.effectiveDate,
          expiryDate: batch.expiryDate,
          total: batch.hours,
          used,
          reserved,
          available,
          status,
          expiringSoon:
            status === "active" &&
            batch.expiryDate <= soonDate &&
            available > 0,
          // 尚未生效的批次整筆都還沒生效，已經有標示，這裡只列有效中批次之後才多出的部分
          upcomingReleases:
            status === "active"
              ? batch.releases.filter((release) => release.date > today)
              : [],
        };
      });

    const sum = (key: "total" | "used" | "reserved" | "available") =>
      batchResponses.reduce((total, item) => total + item[key], 0);
    return {
      total: sum("total"),
      used: sum("used"),
      reserved: sum("reserved"),
      available: sum("available"),
      batches: batchResponses,
    };
  },
};

/** 曆年制：事假、病假 */
const yearlyStrategy: QuotaStrategy = {
  check({ leaveType, days, myForms }) {
    // 依請假日所屬年度，跨年分別檢查
    const sameTypeForms = myForms.filter(
      (form) => form.leaveTypeId === leaveType.id,
    );
    const years = [...new Set(days.map((day) => Number(day.date.slice(0, 4))))];
    const errors: LeaveFormErrors = {};
    const quotaLines: QuotaLine[] = [];
    for (const year of years) {
      const { used, reserved } = summarizeYear(year, sameTypeForms);
      const available = (leaveType.quotaHours ?? 0) - used - reserved;
      const thisHours = sumHours(
        days.filter((day) => day.date.startsWith(`${year}-`)),
      );
      const label = years.length > 1 ? `${year} 年` : "";
      quotaLines.push({ label, available, remaining: available - thisHours });
      if (thisHours > available && !errors.quota) {
        errors.quota = `${label}可用額度不足：可用 ${available} 小時，本次 ${thisHours} 小時`;
      }
    }
    return { errors, quotaLines };
  },

  summarize({ leaveType, myForms, today }) {
    // 看今年度
    const total = leaveType.quotaHours ?? 0;
    const { used, reserved } = summarizeYear(
      Number(today.slice(0, 4)),
      myForms.filter((form) => form.leaveTypeId === leaveType.id),
    );
    return {
      total,
      used,
      reserved,
      available: total - used - reserved,
      batches: [],
    };
  },
};

/** 單次事件：婚假、喪假 */
const perEventStrategy: QuotaStrategy = {
  check({ leaveType, relation, hours }) {
    // 只檢查這張不超過該次額度，不跨假單累計；喪假還沒選親屬關係時不檢查
    const perEventHours = getPerEventHours(leaveType, relation);
    if (perEventHours === null) {
      return { errors: {}, quotaLines: [] };
    }
    const errors: LeaveFormErrors = {};
    if (hours > perEventHours) {
      const name = relation
        ? `${leaveType.name}（${relation.name}）`
        : leaveType.name;
      errors.hours = `${name}每次最多 ${perEventHours / 8} 日`;
    }
    return {
      errors,
      quotaLines: [{ label: "", available: perEventHours, remaining: null }],
    };
  },

  summarize() {
    // 不跨假單累計，沒有總額可算：數字都是 0，畫面顯示「—」
    return { total: 0, used: 0, reserved: 0, available: 0, batches: [] };
  },
};

/** 各額度類型的策略：新增額度類型時這裡沒補會編譯不過 */
export const QUOTA_STRATEGIES: Record<QuotaType, QuotaStrategy> = {
  batch: batchStrategy,
  yearly: yearlyStrategy,
  per_event: perEventStrategy,
};
