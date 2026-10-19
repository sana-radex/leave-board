import { employeeList, shiftList } from "../data/mockData";
import type { Employee, UserOptionResponse } from "../types/types";
import {
  loadCurrentUserId,
  saveCurrentUserId,
} from "../storage/currentUserStorage";
import { TABLES, readTable, delay } from "./db";

/**
 * （後端用）查出目前使用者。
 * 每次都用存著的 id 重新讀人員表；沒選過或找不到這個人，就用第一位。
 */
export function getCurrentUser(): Employee {
  const employees = readTable(TABLES.employeeList, employeeList);
  const savedId = loadCurrentUserId();
  const user = employees.find((emp) => emp.id === savedId);
  return user ?? employees[0];
}

/** 取得目前使用者 */
export async function getCurrentUserInfo(): Promise<Employee> {
  await delay();
  return getCurrentUser();
}

/** 切換目前使用者，回傳切換後的使用者 */
export async function switchUser(employeeId: string): Promise<Employee> {
  await delay();
  saveCurrentUserId(employeeId);
  return getCurrentUser();
}

/** 取得使用者切換的選項：姓名、角色、班別 */
export async function getUserOptionList(): Promise<UserOptionResponse[]> {
  await delay();
  const employees = readTable(TABLES.employeeList, employeeList);
  const shifts = readTable(TABLES.shiftList, shiftList);
  return employees.map((emp) => {
    const shift = shifts.find((item) => item.id === emp.shiftId);
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      shiftName: shift ? shift.name : "未知",
    };
  });
}
