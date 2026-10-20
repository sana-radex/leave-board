import type { Employee } from "../types/domain";
import type { LeaveQuotaResponse } from "../types/api";
import * as leaveTypeRepository from "../repositories/leaveTypeRepository";
import * as flexLeaveDateRepository from "../repositories/flexLeaveDateRepository";
import * as leaveFormRepository from "../repositories/leaveFormRepository";
import { generateBatches } from "../domain/batch";
import { QUOTA_STRATEGIES } from "../domain/quotaStrategy";

/** 每個假別一列，批次型附每一筆批次 */
export function getQuotaList(
  employee: Employee,
  today: string,
): LeaveQuotaResponse[] {
  const leaveTypes = leaveTypeRepository.findAll();
  const flexDates = flexLeaveDateRepository.findAll();
  const myForms = leaveFormRepository
    .findAll()
    .filter((form) => form.employeeId === employee.id);
  const batches = generateBatches(employee, flexDates, today);

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
      today,
    }),
  }));
}
