import {
  employeeList,
  shiftList,
  leaveTypeList,
  bereavementRelationList,
  flexLeaveDateList,
  leaveFormList,
} from "../data/mockData";
import { calendarDayList } from "../data/calendarDays";
import type {
  AddLeaveFormRequest,
  AddLeaveFormResponse,
  FormAction,
  InboxResponse,
  LeaveForm,
  LeaveFormOptionsResponse,
  LeaveFormPreviewResponse,
  LeaveFormResponse,
  LeaveTypeId,
  Response,
} from "../types/types";
import { TABLES, readTable, writeTable, delay } from "./db";
import { getCurrentUser } from "./currentUserApi";
import {
  getViewerRelation,
  canSeeDetail,
  getAvailableActions,
} from "../domain/permission";
import { applyAction, canDoAction } from "../domain/lifecycle";
import { getTimeOptions } from "../domain/time";
import { generateBatches } from "../domain/batch";
import { validateLeaveForm } from "../domain/validate";
import type { ValidateContext } from "../domain/validate";
import { formatDate } from "../utils/format";
import { actionDoneMessages, actionLabels } from "../utils/label";
import { now, today } from "../utils/today";

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
 * 把資料庫的假單組成回傳格式：id 換成名字，
 * 再依目前使用者和假單的關係遮蔽：其他人看不到假別、備註、簽核歷程，
 * 也看不到撤銷申請（撤銷審核中的假還有效，對其他人顯示成已核准）
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
      status:
        !canSee && form.status === "revoke_pending" ? "approved" : form.status,
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
      actions: getAvailableActions(viewerId, form),
    };
  });
}

/** 取得我的假單：依送出時間由新到舊 */
export async function getMyLeaveFormList(): Promise<LeaveFormResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const myForms = readTable(TABLES.leaveFormList, leaveFormList)
    .filter((form) => form.employeeId === currentUser.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return toResponseList(myForms, currentUser.id);
}

/**
 * 取得行事曆上的假單：自己的所有狀態都回傳；
 * 其他人的只回傳已核准、撤銷審核中（撤銷還沒同意，假照樣有效）
 */
export async function getCalendarLeaveList(): Promise<LeaveFormResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const forms = readTable(TABLES.leaveFormList, leaveFormList).filter(
    (form) =>
      form.employeeId === currentUser.id ||
      form.status === "approved" ||
      form.status === "revoke_pending",
  );
  return toResponseList(forms, currentUser.id);
}

/** 讀出驗證新假單需要的資料：申請人就是目前使用者 */
function getValidateContext(): ValidateContext {
  const applicant = getCurrentUser();
  const employees = readTable(TABLES.employeeList, employeeList);
  const shifts = readTable(TABLES.shiftList, shiftList);
  const shift =
    shifts.find((item) => item.id === applicant.shiftId) ?? shifts[0];
  const todayDate = today();
  const flexDates = readTable(TABLES.flexLeaveDateList, flexLeaveDateList);
  return {
    applicant,
    shift,
    leaveTypes: readTable(TABLES.leaveTypeList, leaveTypeList),
    relations: readTable(
      TABLES.bereavementRelationList,
      bereavementRelationList,
    ),
    employees,
    calendarDays: readTable(TABLES.calendarDayList, calendarDayList),
    batches: generateBatches(applicant, flexDates, todayDate),
    forms: readTable(TABLES.leaveFormList, leaveFormList),
  };
}

/** 取得新增請假表單的選項：班別、時間、假別、喪假親屬、職務代理人、審核人 */
export async function getLeaveFormOptions(): Promise<LeaveFormOptionsResponse> {
  await delay();
  const { applicant, shift, leaveTypes, employees } = getValidateContext();
  const others = employees.filter((emp) => emp.id !== applicant.id);

  return {
    shift,
    timeOptions: getTimeOptions(shift),
    leaveTypes,
    relations: readTable(
      TABLES.bereavementRelationList,
      bereavementRelationList,
    ),
    // 職務代理人：同事名單，排除自己
    deputies: others.map((emp) => ({ id: emp.id, name: emp.name })),
    // 審核人：所有審核人，排除自己
    reviewers: others
      .filter((emp) => emp.role === "reviewer")
      .map((emp) => ({ id: emp.id, name: emp.name })),
  };
}

/** 試算：填表時即時算時數、可用額度、檢查錯誤，不會存檔 */
export async function previewLeaveForm(
  input: AddLeaveFormRequest,
): Promise<LeaveFormPreviewResponse> {
  await delay(200);
  const result = validateLeaveForm(input, getValidateContext());
  return {
    days: result.days,
    hours: result.hours,
    errors: result.errors,
    quotaLines: result.quotaLines,
    deductions: result.deductions.map((item) => ({
      batchName: getBatchName(item.batchId),
      date: item.date,
      hours: item.hours,
    })),
  };
}

/** 送出假單：重新驗證一次，通過才存成待審核 */
export async function addLeaveForm(
  input: AddLeaveFormRequest,
): Promise<AddLeaveFormResponse> {
  await delay();
  const context = getValidateContext();
  const { errors, days, hours, deductions } = validateLeaveForm(
    input,
    context,
  );
  if (Object.keys(errors).length > 0) {
    return { success: false, message: "請修正表單上的錯誤", errors };
  }

  const { applicant, shift, employees } = context;
  const submittedAt = now();
  const newForm: LeaveForm = {
    id: crypto.randomUUID(),
    employeeId: applicant.id,
    leaveTypeId: input.leaveTypeId as LeaveTypeId,
    relationId: input.leaveTypeId === "bereavement" ? input.relationId : null,
    status: "pending",
    // 天制沒有時間，存班別的整天區間
    startTime: `${input.startDate}T${input.startTime ?? shift.fullDayStart}`,
    endTime: `${input.endDate}T${input.endTime ?? shift.fullDayEnd}`,
    days,
    hours,
    deputyId: input.deputyId,
    reviewerId: input.reviewerId,
    note: input.note.trim(),
    submittedAt,
    history: [
      { actorId: applicant.id, at: submittedAt, action: "submit", note: "" },
    ],
    // 依扣除明細預留額度；之後退回、撤銷時依明細退回原批次
    deductions,
  };

  const formList = readTable(TABLES.leaveFormList, leaveFormList);
  writeTable(TABLES.leaveFormList, [...formList, newForm]);

  const reviewer = employees.find((emp) => emp.id === input.reviewerId);
  return {
    success: true,
    message: `已送出，等待${reviewer?.name ?? "審核人"}審核`,
    errors: {},
  };
}

/**
 * 執行假單動作：核准、退回、撤銷、申請撤銷、同意撤銷、不同意撤銷
 * 後端一律重新檢查：目前使用者是不是能做這個動作、假單狀態對不對
 */
export async function performLeaveAction(
  formId: string,
  action: FormAction,
  note: string,
): Promise<Response> {
  await delay();
  const currentUser = getCurrentUser();

  const formList = readTable(TABLES.leaveFormList, leaveFormList);
  const targetForm = formList.find((form) => form.id === formId);
  if (!targetForm) {
    return { success: false, message: "找不到這張假單" };
  }
  if (!canDoAction(currentUser.id, action, targetForm)) {
    return {
      success: false,
      message: `這張假單目前不能「${actionLabels[action]}」，請重新整理後再試`,
    };
  }

  const updatedForm = applyAction(
    targetForm,
    action,
    currentUser.id,
    note.trim(),
    now(),
  );
  writeTable(
    TABLES.leaveFormList,
    formList.map((form) => (form.id === formId ? updatedForm : form)),
  );
  return { success: true, message: actionDoneMessages[action] };
}

/** 審核人是我、還在等我處理的假單 */
function getMyInboxForms(): LeaveForm[] {
  const currentUser = getCurrentUser();
  return readTable(TABLES.leaveFormList, leaveFormList).filter(
    (form) =>
      form.reviewerId === currentUser.id &&
      (form.status === "pending" || form.status === "revoke_pending"),
  );
}

/** 取得待我處理：待審申請、撤銷申請 */
export async function getInboxList(): Promise<InboxResponse> {
  await delay();
  const currentUser = getCurrentUser();
  const forms = getMyInboxForms();

  // 待審申請：依送出時間由舊到新
  const pendingForms = forms
    .filter((form) => form.status === "pending")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  // 撤銷申請：申請撤銷的時間、理由在簽核歷程最後一筆「申請撤銷」
  const revokeRequests = forms
    .filter((form) => form.status === "revoke_pending")
    .map((form) => {
      const records = form.history.filter(
        (record) => record.action === "request_revoke",
      );
      const lastRequest = records[records.length - 1];
      return { form, requestedAt: lastRequest.at, reason: lastRequest.note };
    })
    .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));

  const revokeResponses = toResponseList(
    revokeRequests.map((item) => item.form),
    currentUser.id,
  );

  return {
    pendingList: toResponseList(pendingForms, currentUser.id),
    revokeRequestList: revokeResponses.map((response, index) => ({
      ...response,
      requestedAt: revokeRequests[index].requestedAt,
      reason: revokeRequests[index].reason,
    })),
  };
}

/** 取得待我處理的數量（導覽列用）：待審申請 + 撤銷申請 */
export async function getInboxCount(): Promise<number> {
  await delay();
  return getMyInboxForms().length;
}
