import { employeeList } from "../data/mockData";
import type { AuthSession, Role, Session } from "../types/types";
import { TABLES, readTable, writeTable, delay } from "./db";

/** 模擬登入：找出這個角色的第一位員工，發一個 token 給他；找不到就回傳 null */
export async function login(role: Role): Promise<AuthSession | null> {
  await delay();
  const user = readTable(TABLES.employeeList, employeeList).find(
    (emp) => emp.role === role,
  );
  if (!user) {
    return null;
  }

  // 後端記下：這個 token 是誰的
  const newSession: Session = {
    token: crypto.randomUUID(),
    employeeId: user.id,
  };
  const sessionList = readTable<Session>(TABLES.sessionList, []);
  writeTable(TABLES.sessionList, [...sessionList, newSession]);

  return { token: newSession.token, user };
}

/** 模擬登出：把這個 token 從登入紀錄刪掉，之後就不能再用了 */
export async function logout(token: string): Promise<void> {
  await delay();
  const sessionList = readTable<Session>(TABLES.sessionList, []);
  writeTable(
    TABLES.sessionList,
    sessionList.filter((session) => session.token !== token),
  );
}
