import { leaveTypeList } from "../data/mockData";
import type { LeaveType } from "../types/types";
import { TABLES, readTable, delay } from "./db";

/** 取得所有假別 */
export async function getLeaveTypeList(): Promise<LeaveType[]> {
  await delay();
  return readTable(TABLES.leaveTypeList, leaveTypeList);
}
