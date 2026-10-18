import type { AuthSession } from "../types/types";

const AUTH_KEY = "auth";

/** 讀出登入資料；沒登入就回傳 null */
export function loadAuth(): AuthSession | null {
  const data = localStorage.getItem(AUTH_KEY);
  if (data) {
    return JSON.parse(data) as AuthSession;
  }
  return null;
}

/** 存入登入資料 */
export function saveAuth(session: AuthSession) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

/** 清除登入資料 */
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}
