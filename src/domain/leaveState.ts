import type { FormAction, LeaveStatus } from "../types/types";

/** 一個動作的規則：誰可以做、做完變成哪個狀態 */
export interface Transition {
  /** 誰可以做：本人或該單審核人 */
  actor: "self" | "reviewer";
  /** 執行後的狀態 */
  to: LeaveStatus;
}

/** 一個假單狀態的行為：要知道某個狀態會怎樣，看這裡就好，不用到各處找 if */
export interface LeaveState {
  /** 這個狀態可以做的動作；終止狀態是空物件 */
  transitions: Partial<Record<FormAction, Transition>>;
  /** 對額度的影響：算已使用、算審核中、不算（等於退回原批次） */
  quotaEffect: "used" | "reserved" | null;
  /** 在審核人「待我處理」裡屬於哪一區：待審申請、撤銷申請；不在待辦是 null */
  inboxGroup: "pending" | "revoke" | null;
  /** 其他人在行事曆上看到的狀態；null 是其他人看不到 */
  othersSeeAs: LeaveStatus | null;
}

/** 各假單狀態的行為 */
export const LEAVE_STATES: Record<LeaveStatus, LeaveState> = {
  // 待審核
  pending: {
    transitions: {
      approve: { actor: "reviewer", to: "approved" }, // 核准
      reject: { actor: "reviewer", to: "rejected" }, // 退回
      revoke: { actor: "self", to: "revoked" }, // 撤銷
    },
    quotaEffect: "reserved",
    inboxGroup: "pending",
    othersSeeAs: null,
  },
  // 已核准
  approved: {
    transitions: {
      request_revoke: { actor: "self", to: "revoke_pending" }, // 申請撤銷
    },
    quotaEffect: "used",
    inboxGroup: null,
    othersSeeAs: "approved",
  },
  // 撤銷審核中：撤銷還沒同意，假照樣有效，其他人看到的跟已核准一樣
  revoke_pending: {
    transitions: {
      approve_revoke: { actor: "reviewer", to: "revoked" }, // 同意撤銷
      reject_revoke: { actor: "reviewer", to: "approved" }, // 不同意撤銷
    },
    quotaEffect: "used",
    inboxGroup: "revoke",
    othersSeeAs: "approved",
  },
  // 已退回（終止）
  rejected: {
    transitions: {},
    quotaEffect: null,
    inboxGroup: null,
    othersSeeAs: null,
  },
  // 已撤銷（終止）
  revoked: {
    transitions: {},
    quotaEffect: null,
    inboxGroup: null,
    othersSeeAs: null,
  },
};
