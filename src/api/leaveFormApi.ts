import { leaveFormList } from "../data/mockData";
import type { LeaveForm, AddLeaveFormRequest, Response } from "../types/types";
import { TABLES, readTable, writeTable, delay } from "./db";

/** 取得假單 */
export async function getLeaveFormList(empId: string): Promise<LeaveForm[]> {
  await delay();
  return readTable(TABLES.leaveFormList, leaveFormList).filter(
    (req) => req.employeeId === empId,
  );
}

/** 取得所有人的假單（團隊行事曆用） */
export async function getAllLeaveFormList(): Promise<LeaveForm[]> {
  await delay();
  return readTable(TABLES.leaveFormList, leaveFormList);
}

/** 新增假單 */
export async function addLeaveForm(
  payload: AddLeaveFormRequest,
): Promise<Response> {
  await delay();

  // 表單驗證
  if (payload.startTime >= payload.endTime) {
    return { success: false, message: "結束時間必須晚於開始時間" };
  }
  if (payload.deputyId === payload.employeeId) {
    return { success: false, message: "職務代理人不能是自己" };
  }

  const newRequest: LeaveForm = {
    id: crypto.randomUUID(),
    status: "pending",
    employeeId: payload.employeeId,
    leaveTypeId: payload.leaveTypeId,
    startTime: payload.startTime,
    endTime: payload.endTime,
    deputyId: payload.deputyId,
    note: payload.note.trim(),
    submittedAt: new Date().toISOString(),
  };

  const requestList = readTable(TABLES.leaveFormList, leaveFormList);
  writeTable(TABLES.leaveFormList, [...requestList, newRequest]);
  return { success: true, message: "假單已送出！" };
}

/** 撤銷假單 */
export async function revokeLeaveForm(
  formId: string,
  empId: string,
): Promise<Response> {
  await delay();
  const requestList = readTable(TABLES.leaveFormList, leaveFormList);
  const targetForm = requestList.find((req) => req.id === formId);
  if (!targetForm) {
    return { success: false, message: "找不到這張假單" };
  }
  if (targetForm.employeeId !== empId) {
    return { success: false, message: "這張假單不屬於您" };
  }
  if (targetForm.status !== "pending") {
    return { success: false, message: "只有待審核的假單可以被撤銷" };
  }

  const revokedRequest: LeaveForm = {
    ...targetForm,
    status: "revoked",
  };
  writeTable(
    TABLES.leaveFormList,
    requestList.map((req) => (req.id === formId ? revokedRequest : req)),
  );
  return { success: true, message: "假單已撤銷！" };
}
