import { departmentList } from "../data/mockData";
import type { Department } from "../types/types";
import { TABLES, readTable, delay } from "./db";

/** 取得所有部門 */
export async function getDepartmentList(): Promise<Department[]> {
  await delay();
  return readTable(TABLES.departmentList, departmentList);
}
