import { flexLeaveDateList, leaveFormList, leaveTypeList } from "../data/mockData";
import type { LeaveQuotaResponse } from "../types/types";
import { TABLES, readTable, delay } from "./db";
import { getCurrentUser } from "./currentUserApi";
import { generateBatches } from "../domain/batch";
import { QUOTA_STRATEGIES } from "../domain/quotaStrategy";
import { today } from "../utils/today";

/** 取得我的額度：每個假別一列，批次型附每一筆批次（只能看自己的） */
export async function getMyQuota(): Promise<LeaveQuotaResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const todayDate = today();
  const leaveTypes = readTable(TABLES.leaveTypeList, leaveTypeList);
  const flexDates = readTable(TABLES.flexLeaveDateList, flexLeaveDateList);
  const myForms = readTable(TABLES.leaveFormList, leaveFormList).filter(
    (form) => form.employeeId === currentUser.id,
  );
  const batches = generateBatches(currentUser, flexDates, todayDate);

  // 數字依額度類型交給對應的策略算
  return leaveTypes.map((leaveType) => ({
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.name,
    leaveTypeDescription: leaveType.description,
    quotaType: leaveType.quotaType,
    ...QUOTA_STRATEGIES[leaveType.quotaType].summarize({
      leaveType,
      batches,
      myForms,
      today: todayDate,
    }),
  }));
}
