import type { FormAction, LeaveForm, LeaveTypeId } from "../types/domain";
import type {
  AddLeaveFormRequest,
  AddLeaveFormResponse,
  InboxResponse,
  LeaveFormOptionsResponse,
  LeaveFormPreviewResponse,
  LeaveFormResponse,
  Response,
} from "../types/api";
import * as employeeRepository from "../repositories/employeeRepository";
import * as shiftRepository from "../repositories/shiftRepository";
import * as leaveTypeRepository from "../repositories/leaveTypeRepository";
import * as bereavementRelationRepository from "../repositories/bereavementRelationRepository";
import * as flexLeaveDateRepository from "../repositories/flexLeaveDateRepository";
import * as calendarDayRepository from "../repositories/calendarDayRepository";
import * as leaveFormRepository from "../repositories/leaveFormRepository";
import { delay } from "./delay";
import { getCurrentUser } from "./currentUserApi";
import {
  getViewerRelation,
  canSeeDetail,
  getAvailableActions,
} from "../domain/permission";
import { applyAction, canDoAction } from "../domain/lifecycle";
import { LEAVE_STATES } from "../domain/leaveState";
import { getTimeOptions } from "../domain/time";
import { generateBatches } from "../domain/batch";
import { validateLeaveForm } from "../domain/validate";
import type { ValidateContext } from "../domain/validate";
import { actionDoneMessages, actionLabels } from "../utils/label";
import { now, today } from "../utils/today";

/**
 * 把資料庫的假單組成回傳格式：id 換成名字，
 * 再依目前使用者和假單的關係遮蔽：其他人看不到假別、備註、簽核歷程，
 * 狀態也換成其他人看到的（例如撤銷審核中看成已核准）
 */
function toResponseList(
  forms: LeaveForm[],
  viewerId: string,
): LeaveFormResponse[] {
  const employees = employeeRepository.findAll();
  const shifts = shiftRepository.findAll();
  const leaveTypes = leaveTypeRepository.findAll();
  const relations = bereavementRelationRepository.findAll();

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
      status: canSee
        ? form.status
        : (LEAVE_STATES[form.status].othersSeeAs ?? form.status),
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
      actions: getAvailableActions(viewerId, form),
    };
  });
}

/** 取得我的假單：依送出時間由新到舊 */
export async function getMyLeaveFormList(): Promise<LeaveFormResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const myForms = leaveFormRepository
    .findAll()
    .filter((form) => form.employeeId === currentUser.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return toResponseList(myForms, currentUser.id);
}

/**
 * 取得行事曆上的假單：自己的所有狀態都回傳；
 * 其他人的只回傳其他人看得到的狀態
 */
export async function getCalendarLeaveList(): Promise<LeaveFormResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const forms = leaveFormRepository.findAll().filter(
    (form) =>
      form.employeeId === currentUser.id ||
      LEAVE_STATES[form.status].othersSeeAs !== null,
  );
  return toResponseList(forms, currentUser.id);
}

/** 讀出驗證新假單需要的資料：申請人就是目前使用者 */
function getValidateContext(): ValidateContext {
  const applicant = getCurrentUser();
  const shift =
    shiftRepository.findById(applicant.shiftId) ??
    shiftRepository.findAll()[0];
  const todayDate = today();
  const flexDates = flexLeaveDateRepository.findAll();
  return {
    applicant,
    shift,
    leaveTypes: leaveTypeRepository.findAll(),
    relations: bereavementRelationRepository.findAll(),
    employees: employeeRepository.findAll(),
    calendarDays: calendarDayRepository.findAll(),
    batches: generateBatches(applicant, flexDates, todayDate),
    forms: leaveFormRepository.findAll(),
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
    relations: bereavementRelationRepository.findAll(),
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
  };
}

/** 送出假單：重新驗證一次，通過才存成待審核 */
export async function addLeaveForm(
  input: AddLeaveFormRequest,
): Promise<AddLeaveFormResponse> {
  await delay();
  const context = getValidateContext();
  const { errors, days, hours } = validateLeaveForm(input, context);
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
  };

  leaveFormRepository.add(newForm);

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

  const targetForm = leaveFormRepository.findById(formId);
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
  leaveFormRepository.update(updatedForm);
  return { success: true, message: actionDoneMessages[action] };
}

/** 審核人是我、還在等我處理的假單 */
function getMyInboxForms(): LeaveForm[] {
  const currentUser = getCurrentUser();
  return leaveFormRepository.findAll().filter(
    (form) =>
      form.reviewerId === currentUser.id &&
      LEAVE_STATES[form.status].inboxGroup !== null,
  );
}

/** 取得待我處理：待審申請、撤銷申請 */
export async function getInboxList(): Promise<InboxResponse> {
  await delay();
  const currentUser = getCurrentUser();
  const forms = getMyInboxForms();

  // 待審申請：依送出時間由舊到新
  const pendingForms = forms
    .filter((form) => LEAVE_STATES[form.status].inboxGroup === "pending")
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  // 撤銷申請：申請撤銷的時間、理由在簽核歷程最後一筆「申請撤銷」
  const revokeRequests = forms
    .filter((form) => LEAVE_STATES[form.status].inboxGroup === "revoke")
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
