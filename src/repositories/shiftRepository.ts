import { shiftList } from "../data/mockData";
import type { Shift } from "../types/domain";
import { TABLES, readTable } from "./db";

export function findAll(): Shift[] {
  return readTable(TABLES.shiftList, shiftList);
}

export function findById(id: string): Shift | undefined {
  return findAll().find((shift) => shift.id === id);
}
