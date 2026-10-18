import { employeeList, leaveFormList, leaveTypeList } from "../data/mockData";
import type {
  LeaveForm,
  LeaveFormResponse,
  LeaveTypeId,
  AddLeaveFormRequest,
  Response,
} from "../types/types";
import { TABLES, readTable, writeTable, delay } from "./db";
import { getLoginUser } from "./authApi";

/** 把資料庫的假單組成回傳格式：id 換成名字（就像資料庫的 JOIN） */
function toResponseList(forms: LeaveForm[]): LeaveFormResponse[] {
  const employees = readTable(TABLES.employeeList, employeeList);
  const leaveTypes = readTable(TABLES.leaveTypeList, leaveTypeList);

  /** 取得員工名稱 */
  function getEmployeeName(empId: string): string {
    const employee = employees.find((emp) => emp.id === empId);
    return employee ? employee.name : "未知";
  }

  /** 取得假別名稱 */
  function getLeaveTypeName(typeId: LeaveTypeId): string {
    const leaveType = leaveTypes.find((type) => type.id === typeId);
    return leaveType ? leaveType.name : "未知";
  }

  return forms.map((form) => ({
    id: form.id,
    employeeName: getEmployeeName(form.employeeId),
    leaveTypeName: getLeaveTypeName(form.leaveTypeId),
    status: form.status,
    startTime: form.startTime,
    endTime: form.endTime,
    deputyName: getEmployeeName(form.deputyId),
    note: form.note,
    submittedAt: form.submittedAt,
  }));
}

/** 取得我的假單 */
export async function getMyLeaveFormList(): Promise<LeaveFormResponse[]> {
  await delay();
  const loginUser = getLoginUser();
  if (!loginUser) {
    return [];
  }

  const myForms = readTable(TABLES.leaveFormList, leaveFormList).filter(
    (req) => req.employeeId === loginUser.id,
  );
  return toResponseList(myForms);
}

/** 取得行事曆上看得到的假單 */
export async function getTeamLeaveFormList(): Promise<LeaveFormResponse[]> {
  await delay();
  const viewer = getLoginUser();
  if (!viewer) {
    return [];
  }

  const employees = readTable(TABLES.employeeList, employeeList);
  const forms = readTable(TABLES.leaveFormList, leaveFormList);

  if (viewer.role === "employee") {
    return toResponseList(forms.filter((form) => form.employeeId === viewer.id));
  }

  // 主管：先找出同部門的人，再挑出這些人的假單
  const memberIds = employees
    .filter((emp) => emp.departmentId === viewer.departmentId)
    .map((emp) => emp.id);
  return toResponseList(
    forms.filter((form) => memberIds.includes(form.employeeId)),
  );
}

/** 新增假單 */
export async function addLeaveForm(
  payload: AddLeaveFormRequest,
): Promise<Response> {
  await delay();
  const loginUser = getLoginUser();
  if (!loginUser) {
    return { success: false, message: "請先登入" };
  }

  // 表單驗證
  if (payload.startTime >= payload.endTime) {
    return { success: false, message: "結束時間必須晚於開始時間" };
  }
  if (payload.deputyId === loginUser.id) {
    return { success: false, message: "職務代理人不能是自己" };
  }

  const newRequest: LeaveForm = {
    id: crypto.randomUUID(),
    status: "pending",
    employeeId: loginUser.id,
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
export async function revokeLeaveForm(formId: string): Promise<Response> {
  await delay();
  const loginUser = getLoginUser();
  if (!loginUser) {
    return { success: false, message: "請先登入" };
  }

  const requestList = readTable(TABLES.leaveFormList, leaveFormList);
  const targetForm = requestList.find((req) => req.id === formId);
  if (!targetForm) {
    return { success: false, message: "找不到這張假單" };
  }
  if (targetForm.employeeId !== loginUser.id) {
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
