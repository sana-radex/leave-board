import type {
  Employee,
  FormAction,
  LeaveForm,
  LeaveTypeId,
  Shift,
} from "../types/domain";
import type {
  AddLeaveFormRequest,
  InboxResponse,
  LeaveFormErrors,
  LeaveFormOptionsResponse,
  LeaveFormPreviewResponse,
  LeaveFormResponse,
} from "../types/api";
import * as employeeRepository from "../repositories/employeeRepository";
import * as shiftRepository from "../repositories/shiftRepository";
import * as leaveTypeRepository from "../repositories/leaveTypeRepository";
import * as bereavementRelationRepository from "../repositories/bereavementRelationRepository";
import * as flexLeaveDateRepository from "../repositories/flexLeaveDateRepository";
import * as calendarDayRepository from "../repositories/calendarDayRepository";
import * as leaveFormRepository from "../repositories/leaveFormRepository";
import { applyAction, canDoAction } from "../domain/lifecycle";
import { LEAVE_STATES } from "../domain/leaveState";
import { getTimeOptions } from "../domain/time";
import { generateBatches } from "../domain/batch";
import { validateLeaveForm } from "../domain/validate";
import type { ValidateContext } from "../domain/validate";
import { toLeaveFormResponses } from "./leaveFormMapper";

export function listMine(viewer: Employee): LeaveFormResponse[] {
  const myForms = leaveFormRepository
    .findAll()
    .filter((form) => form.employeeId === viewer.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return toLeaveFormResponses(myForms, viewer.id);
}

/** 自己的所有狀態都回傳；其他人的只回傳其他人看得到的狀態 */
export function listForCalendar(viewer: Employee): LeaveFormResponse[] {
  const forms = leaveFormRepository
    .findAll()
    .filter(
      (form) =>
        form.employeeId === viewer.id ||
        LEAVE_STATES[form.status].othersSeeAs !== null,
    );
  return toLeaveFormResponses(forms, viewer.id);
}

/** 申請人的班別；找不到就用第一個班別 */
function getShift(applicant: Employee): Shift {
  return (
    shiftRepository.findById(applicant.shiftId) ??
    shiftRepository.findAll()[0]
  );
}

function buildValidateContext(
  applicant: Employee,
  today: string,
): ValidateContext {
  const flexDates = flexLeaveDateRepository.findAll();
  return {
    applicant,
    shift: getShift(applicant),
    leaveTypes: leaveTypeRepository.findAll(),
    relations: bereavementRelationRepository.findAll(),
    employees: employeeRepository.findAll(),
    calendarDays: calendarDayRepository.findAll(),
    batches: generateBatches(applicant, flexDates, today),
    forms: leaveFormRepository.findAll(),
  };
}

export function getOptions(applicant: Employee): LeaveFormOptionsResponse {
  const shift = getShift(applicant);
  const others = employeeRepository
    .findAll()
    .filter((emp) => emp.id !== applicant.id);

  return {
    shift,
    timeOptions: getTimeOptions(shift),
    leaveTypes: leaveTypeRepository.findAll(),
    relations: bereavementRelationRepository.findAll(),
    // 職務代理人：同事名單，排除自己
    deputies: others.map((emp) => ({ id: emp.id, name: emp.name })),
    // 審核人：所有審核人，排除自己
    reviewers: others
      .filter((emp) => emp.role === "reviewer")
      .map((emp) => ({ id: emp.id, name: emp.name })),
  };
}

export function preview(
  applicant: Employee,
  input: AddLeaveFormRequest,
  today: string,
): LeaveFormPreviewResponse {
  const result = validateLeaveForm(
    input,
    buildValidateContext(applicant, today),
  );
  return {
    days: result.days,
    hours: result.hours,
    errors: result.errors,
    quotaLines: result.quotaLines,
  };
}

/** 重新驗證一次，通過才存成待審核 */
export function submit(
  applicant: Employee,
  input: AddLeaveFormRequest,
  today: string,
  now: string,
): { ok: true } | { ok: false; errors: LeaveFormErrors } {
  const context = buildValidateContext(applicant, today);
  const { errors, days, hours } = validateLeaveForm(input, context);
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const { shift } = context;
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
    submittedAt: now,
    history: [{ actorId: applicant.id, at: now, action: "submit", note: "" }],
  };
  leaveFormRepository.add(newForm);
  return { ok: true };
}

/** 一律重新檢查：這個人能不能做這個動作、假單狀態對不對 */
export function performAction(
  actor: Employee,
  formId: string,
  action: FormAction,
  note: string,
  now: string,
): { ok: true } | { ok: false; reason: "not_found" | "not_allowed" } {
  const targetForm = leaveFormRepository.findById(formId);
  if (!targetForm) {
    return { ok: false, reason: "not_found" };
  }
  if (!canDoAction(actor.id, action, targetForm)) {
    return { ok: false, reason: "not_allowed" };
  }

  leaveFormRepository.update(
    applyAction(targetForm, action, actor.id, note.trim(), now),
  );
  return { ok: true };
}

/** 審核人是自己、還在等審核的假單 */
function findInboxForms(reviewer: Employee): LeaveForm[] {
  return leaveFormRepository
    .findAll()
    .filter(
      (form) =>
        form.reviewerId === reviewer.id &&
        LEAVE_STATES[form.status].inboxGroup !== null,
    );
}

export function getInbox(reviewer: Employee): InboxResponse {
  const forms = findInboxForms(reviewer);

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

  const revokeResponses = toLeaveFormResponses(
    revokeRequests.map((item) => item.form),
    reviewer.id,
  );

  return {
    pendingList: toLeaveFormResponses(pendingForms, reviewer.id),
    revokeRequestList: revokeResponses.map((response, index) => ({
      ...response,
      requestedAt: revokeRequests[index].requestedAt,
      reason: revokeRequests[index].reason,
    })),
  };
}

export function countInbox(reviewer: Employee): number {
  return findInboxForms(reviewer).length;
}
