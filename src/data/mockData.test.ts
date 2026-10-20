import { describe, it, expect } from "vitest";
import {
  employeeList,
  shiftList,
  leaveTypeList,
  bereavementRelationList,
  flexLeaveDateList,
  leaveFormList,
} from "./mockData";
import { calendarDayList } from "./calendarDays";
import { splitLeaveDays } from "../domain/time";
import { generateBatches } from "../domain/batch";
import { allocateBatches } from "../domain/quota";

/** 今天：2026/10/19（基準日） */
const TODAY = "2026-10-19";

/** 批次型假別（特休、彈性假、生日假）的假單 */
const batchForms = leaveFormList.filter(
  (form) =>
    leaveTypeList.find((type) => type.id === form.leaveTypeId)?.quotaType ===
    "batch",
);

/** 檢查手寫的預設假單有沒有前後不一致 */
describe("預設假單", () => {
  it("有 L01～L11 共 11 張", () => {
    expect(leaveFormList.map((form) => form.id)).toEqual([
      "L01", "L02", "L03", "L04", "L05", "L06",
      "L07", "L08", "L09", "L10", "L11",
    ]);
  });

  it.each(leaveFormList)("$id 的人員、班別、假別、親屬關係都找得到", (form) => {
    const ids = employeeList.map((emp) => emp.id);
    expect(ids).toContain(form.employeeId);
    expect(ids).toContain(form.deputyId);
    expect(ids).toContain(form.reviewerId);
    expect(leaveTypeList.map((type) => type.id)).toContain(form.leaveTypeId);
    if (form.relationId !== null) {
      expect(bereavementRelationList.map((r) => r.id)).toContain(form.relationId);
    }
  });

  it.each(leaveFormList)("$id 的審核人具審核人角色，且不是申請人", (form) => {
    const reviewer = employeeList.find((emp) => emp.id === form.reviewerId);
    expect(reviewer?.role).toBe("reviewer");
    expect(form.reviewerId).not.toBe(form.employeeId);
  });

  it.each(leaveFormList)("$id 的時數等於每日明細加總", (form) => {
    const sum = form.days.reduce((total, day) => total + day.hours, 0);
    expect(form.hours).toBe(sum);
  });

  it.each(leaveFormList)("$id 的起訖等於第一天開始、最後一天結束", (form) => {
    const first = form.days[0];
    const last = form.days[form.days.length - 1];
    expect(form.startTime).toBe(`${first.date}T${first.startTime}`);
    expect(form.endTime).toBe(`${last.date}T${last.endTime}`);
  });

  it.each(leaveFormList)("$id 的每日時數不超過申請人班別的每日工時", (form) => {
    const employee = employeeList.find((emp) => emp.id === form.employeeId);
    const shift = shiftList.find((item) => item.id === employee?.shiftId);
    for (const day of form.days) {
      expect(day.hours).toBeLessThanOrEqual(shift!.dailyHours);
    }
  });

  it.each(leaveFormList)("$id 的第一筆歷程是送出，時間等於送出時間", (form) => {
    expect(form.history[0].action).toBe("submit");
    expect(form.history[0].actorId).toBe(form.employeeId);
    expect(form.history[0].at).toBe(form.submittedAt);
  });

  it.each(leaveFormList)("$id 的歷程時間由舊到新", (form) => {
    const times = form.history.map((record) => record.at);
    expect([...times].sort()).toEqual(times);
  });

  it.each(batchForms)("$id 批次型假別的每一天都分配得到批次", (form) => {
    const employee = employeeList.find((emp) => emp.id === form.employeeId)!;
    const batches = generateBatches(employee, flexLeaveDateList, TODAY).filter(
      (batch) => batch.leaveTypeId === form.leaveTypeId,
    );
    const sameTypeForms = leaveFormList.filter(
      (item) =>
        item.employeeId === form.employeeId &&
        item.leaveTypeId === form.leaveTypeId,
    );
    expect(allocateBatches(batches, sameTypeForms).failedDays).toEqual([]);
  });

  it.each(leaveFormList)("$id 用時數規則重算，每日明細和手寫的一樣", (form) => {
    const employee = employeeList.find((emp) => emp.id === form.employeeId)!;
    const shift = shiftList.find((item) => item.id === employee.shiftId)!;
    const leaveType = leaveTypeList.find((type) => type.id === form.leaveTypeId)!;
    const [startDate, startTime] = form.startTime.split("T");
    const [endDate, endTime] = form.endTime.split("T");
    const isDayUnit = leaveType.unit === "day";

    const days = splitLeaveDays({
      unit: leaveType.unit,
      startDate,
      startTime: isDayUnit ? null : startTime,
      endDate,
      endTime: isDayUnit ? null : endTime,
      shift,
      calendarDays: calendarDayList,
    });
    expect(days).toEqual(form.days);
  });
});
