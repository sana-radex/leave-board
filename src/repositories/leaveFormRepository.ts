import { leaveFormList } from "../data/mockData";
import type { LeaveForm } from "../types/domain";
import { TABLES, readTable, writeTable } from "./db";

export function findAll(): LeaveForm[] {
  return readTable(TABLES.leaveFormList, leaveFormList);
}

export function findById(id: string): LeaveForm | undefined {
  return findAll().find((form) => form.id === id);
}

export function add(form: LeaveForm) {
  writeTable(TABLES.leaveFormList, [...findAll(), form]);
}

export function update(form: LeaveForm) {
  writeTable(
    TABLES.leaveFormList,
    findAll().map((item) => (item.id === form.id ? form : item)),
  );
}
