import { employeeList } from "../data/mockData";
import type { AuthSession, Employee, Role } from "../types/types";
import { loadAuth } from "../storage/authStorage";
import { TABLES, readTable, delay } from "./db";

/** 查出這次打 API 的是誰 */
export function getLoginUser(): Employee | null {
  const auth = loadAuth();
  return auth ? auth.user : null;
}

/** 模擬登入：找出這個角色的第一位員工，發一個 token 給他；找不到就回傳 null */
export async function login(role: Role): Promise<AuthSession | null> {
  await delay();
  const user = readTable(TABLES.employeeList, employeeList).find(
    (emp) => emp.role === role,
  );
  if (!user) {
    return null;
  }
  return { token: crypto.randomUUID(), user };
}

/** 模擬登出 */
export async function logout(): Promise<void> {
  await delay();
}
