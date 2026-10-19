import {
  employeeList,
  shiftList,
  leaveTypeList,
  bereavementRelationList,
  leaveFormList,
} from "../data/mockData";
import type { LeaveForm, LeaveFormResponse, Response } from "../types/types";
import { TABLES, readTable, writeTable, delay } from "./db";
import { getCurrentUser } from "./currentUserApi";
import {
  getViewerRelation,
  canSeeDetail,
  isOnCalendar,
} from "../domain/permission";
import { formatDate } from "../utils/format";
import { now } from "../utils/today";

/** 批次名稱：從批次 id 組出來，例如 'annual:E03:2026-03-01' → '特休（2026/3/1）' */
function getBatchName(batchId: string): string {
  const [leaveTypeId, , key] = batchId.split(":");
  if (leaveTypeId === "annual") {
    return `特休（${formatDate(key)}）`;
  }
  if (leaveTypeId === "flex") {
    return `彈性假（${formatDate(key)}）`;
  }
  // 生日假的 key 是年度，例如 'birthday:E01:2026'
  return `生日假（${key}）`;
}

/**
 * 把資料庫的假單組成回傳格式：id 換成名字（就像資料庫的 JOIN），
 * 再依目前使用者和假單的關係遮蔽：其他人看不到假別、備註、簽核歷程（規格 2.3）
 */
function toResponseList(
  forms: LeaveForm[],
  viewerId: string,
): LeaveFormResponse[] {
  const employees = readTable(TABLES.employeeList, employeeList);
  const shifts = readTable(TABLES.shiftList, shiftList);
  const leaveTypes = readTable(TABLES.leaveTypeList, leaveTypeList);
  const relations = readTable(
    TABLES.bereavementRelationList,
    bereavementRelationList,
  );

  /** 取得人員姓名 */
  function getEmployeeName(empId: string): string {
    const employee = employees.find((emp) => emp.id === empId);
    return employee ? employee.name : "未知";
  }

  /** 取得申請人的每日工時，用來判斷某天是不是整天 */
  function getDailyHours(empId: string): number {
    const employee = employees.find((emp) => emp.id === empId);
    const shift = shifts.find((item) => item.id === employee?.shiftId);
    return shift ? shift.dailyHours : 8;
  }

  return forms.map((form) => {
    const relation = getViewerRelation(viewerId, form);
    const canSee = canSeeDetail(relation);
    const leaveType = leaveTypes.find((type) => type.id === form.leaveTypeId);
    const bereavementRelation = relations.find(
      (item) => item.id === form.relationId,
    );
    const dailyHours = getDailyHours(form.employeeId);

    return {
      id: form.id,
      isMine: relation === "self",
      canSeeDetail: canSee,
      employeeName: getEmployeeName(form.employeeId),
      leaveTypeName: canSee ? (leaveType?.name ?? "未知") : "請假",
      leaveTypeUnit: canSee ? (leaveType?.unit ?? null) : null,
      relationName:
        canSee && bereavementRelation ? bereavementRelation.name : null,
      status: form.status,
      startTime: form.startTime,
      endTime: form.endTime,
      days: form.days.map((day) => ({
        ...day,
        isFullDay: day.hours === dailyHours,
      })),
      hours: form.hours,
      deputyName: getEmployeeName(form.deputyId),
      reviewerName: getEmployeeName(form.reviewerId),
      note: canSee ? form.note : "",
      submittedAt: form.submittedAt,
      history: canSee
        ? form.history.map((record) => ({
            actorName: getEmployeeName(record.actorId),
            at: record.at,
            action: record.action,
            note: record.note,
          }))
        : [],
      deductions: canSee
        ? form.deductions.map((item) => ({
            batchName: getBatchName(item.batchId),
            date: item.date,
            hours: item.hours,
          }))
        : [],
    };
  });
}

/** 取得我的假單：依送出時間由新到舊（F-03） */
export async function getMyLeaveFormList(): Promise<LeaveFormResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const myForms = readTable(TABLES.leaveFormList, leaveFormList)
    .filter((form) => form.employeeId === currentUser.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return toResponseList(myForms, currentUser.id);
}

/** 取得行事曆上的假單：全公司，只回傳會出現在行事曆上的（F-06） */
export async function getCalendarLeaveList(): Promise<LeaveFormResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const forms = readTable(TABLES.leaveFormList, leaveFormList).filter(
    isOnCalendar,
  );
  return toResponseList(forms, currentUser.id);
}

/** 撤銷假單（階段 3 改成統一的假單動作） */
export async function revokeLeaveForm(formId: string): Promise<Response> {
  await delay();
  const currentUser = getCurrentUser();

  const formList = readTable(TABLES.leaveFormList, leaveFormList);
  const targetForm = formList.find((form) => form.id === formId);
  if (!targetForm) {
    return { success: false, message: "找不到這張假單" };
  }
  if (targetForm.employeeId !== currentUser.id) {
    return { success: false, message: "這張假單不屬於您" };
  }
  if (targetForm.status !== "pending") {
    return { success: false, message: "只有待審核的假單可以撤銷" };
  }

  const revokedForm: LeaveForm = {
    ...targetForm,
    status: "revoked",
    history: [
      ...targetForm.history,
      { actorId: currentUser.id, at: now(), action: "revoke", note: "" },
    ],
  };
  writeTable(
    TABLES.leaveFormList,
    formList.map((form) => (form.id === formId ? revokedForm : form)),
  );
  return { success: true, message: "假單已撤銷！" };
}
