import type { LeaveForm } from "../types/domain";
import type { LeaveFormResponse } from "../types/api";
import * as employeeRepository from "../repositories/employeeRepository";
import * as shiftRepository from "../repositories/shiftRepository";
import * as leaveTypeRepository from "../repositories/leaveTypeRepository";
import * as bereavementRelationRepository from "../repositories/bereavementRelationRepository";
import {
  getViewerRelation,
  canSeeDetail,
  getAvailableActions,
} from "../domain/permission";
import { LEAVE_STATES } from "../domain/leaveState";

/**
 * 把資料庫的假單組成回傳格式：id 換成名字，
 * 再依目前使用者和假單的關係遮蔽：其他人看不到假別、備註、簽核歷程，
 * 狀態也換成其他人看到的（例如撤銷審核中看成已核准）
 */
export function toLeaveFormResponses(
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
