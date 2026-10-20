import { flexLeaveDateList } from "../data/mockData";
import type { FlexLeaveDate } from "../types/domain";
import { TABLES, readTable } from "./db";

export function findAll(): FlexLeaveDate[] {
  return readTable(TABLES.flexLeaveDateList, flexLeaveDateList);
}
