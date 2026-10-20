import { leaveTypeList } from "../data/mockData";
import type { LeaveType } from "../types/domain";
import { TABLES, readTable } from "./db";

export function findAll(): LeaveType[] {
  return readTable(TABLES.leaveTypeList, leaveTypeList);
}
