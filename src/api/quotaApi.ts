import {
  bereavementRelationList,
  flexLeaveDateList,
  leaveFormList,
  leaveTypeList,
} from "../data/mockData";
import type {
  BatchQuotaResponse,
  BatchStatus,
  LeaveQuotaResponse,
} from "../types/types";
import { TABLES, readTable, delay } from "./db";
import { getCurrentUser } from "./currentUserApi";
import { generateBatches } from "../domain/batch";
import { summarizeBatches, summarizeYear } from "../domain/quota";
import { addDays } from "../domain/date";
import { today } from "../utils/today";

/** 取得我的額度：每個假別一列，批次型附每一筆批次（F-04，只能看自己的） */
export async function getMyQuota(): Promise<LeaveQuotaResponse[]> {
  await delay();
  const currentUser = getCurrentUser();
  const todayDate = today();
  const leaveTypes = readTable(TABLES.leaveTypeList, leaveTypeList);
  const relations = readTable(
    TABLES.bereavementRelationList,
    bereavementRelationList,
  );
  const flexDates = readTable(TABLES.flexLeaveDateList, flexLeaveDateList);
  const myForms = readTable(TABLES.leaveFormList, leaveFormList).filter(
    (form) => form.employeeId === currentUser.id,
  );
  const batches = generateBatches(currentUser, flexDates, todayDate);
  // 30 天內到期：到期日不晚於今天 + 30 天
  const soonDate = addDays(todayDate, 30);

  return leaveTypes.map((leaveType) => {
    const base = {
      leaveTypeId: leaveType.id,
      leaveTypeName: leaveType.name,
      quotaType: leaveType.quotaType,
    };

    // ---------- 批次型：特休、彈性假、生日假 ----------
    if (leaveType.quotaType === "batch") {
      // 已過期批次不計算也不顯示：只留有效中＋尚未生效（到期日不早於今天）
      const summaries = summarizeBatches(
        batches.filter(
          (batch) =>
            batch.leaveTypeId === leaveType.id && batch.expiryDate >= todayDate,
        ),
        myForms,
      );
      const batchResponses: BatchQuotaResponse[] = summaries.map(
        ({ batch, used, reserved, available }) => {
          const status: BatchStatus =
            batch.effectiveDate > todayDate ? "upcoming" : "active";
          return {
            id: batch.id,
            name: batch.name,
            effectiveDate: batch.effectiveDate,
            expiryDate: batch.expiryDate,
            total: batch.hours,
            used,
            reserved,
            available,
            status,
            expiringSoon:
              status === "active" &&
              batch.expiryDate <= soonDate &&
              available > 0,
            isTaken: used + reserved > 0,
          };
        },
      );

      const sum = (key: "total" | "used" | "reserved" | "available") =>
        batchResponses.reduce((total, item) => total + item[key], 0);
      return {
        ...base,
        total: sum("total"),
        used: sum("used"),
        reserved: sum("reserved"),
        available: sum("available"),
        batches: batchResponses,
        perEvent: [],
      };
    }

    // ---------- 曆年制：事假、病假，看今年度 ----------
    if (leaveType.quotaType === "yearly") {
      const total = leaveType.quotaHours ?? 0;
      const { used, reserved } = summarizeYear(
        Number(todayDate.slice(0, 4)),
        myForms.filter((form) => form.leaveTypeId === leaveType.id),
      );
      return {
        ...base,
        total,
        used,
        reserved,
        available: total - used - reserved,
        batches: [],
        perEvent: [],
      };
    }

    // ---------- 單次事件：婚假、喪假，只顯示每次額度 ----------
    let perEvent = [{ label: "", hours: leaveType.quotaHours ?? 0 }];
    if (leaveType.id === "bereavement") {
      // 依天數分組：8 日、6 日、3 日各列出對應的親屬
      const dayGroups = [...new Set(relations.map((item) => item.days))];
      perEvent = dayGroups.map((days) => ({
        label: relations
          .filter((item) => item.days === days)
          .map((item) => item.name)
          .join("、"),
        hours: days * 8,
      }));
    }
    return {
      ...base,
      total: 0,
      used: 0,
      reserved: 0,
      available: 0,
      batches: [],
      perEvent,
    };
  });
}
