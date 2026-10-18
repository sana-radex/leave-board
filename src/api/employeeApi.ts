import { employeeList } from "../data/mockData";
import type { Employee } from "../types/types";
import { TABLES, readTable, delay } from "./db";

/** 取得所有員工 */
export async function getEmployeeList(): Promise<Employee[]> {
  await delay();
   return readTable(TABLES.employeeList, employeeList);
}