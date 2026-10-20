import { employeeList } from "../data/mockData";
import type { Employee } from "../types/domain";
import { TABLES, readTable } from "./db";

export function findAll(): Employee[] {
  return readTable(TABLES.employeeList, employeeList);
}
