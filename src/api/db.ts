import { clearCurrentUserId } from "../storage/currentUserStorage";

/** 每張資料表在 localStorage 裡的名字 */
export const TABLES = {
  employeeList: "employeeList",
  shiftList: "shiftList",
  leaveTypeList: "leaveTypeList",
  bereavementRelationList: "bereavementRelationList",
  flexLeaveDateList: "flexLeaveDateList",
  leaveFormList: "leaveFormList",
  calendarDayList: "calendarDayList",
};

/** 讀出一整張資料表；第一次讀的時候，先放入初始資料 */
export function readTable<T>(key: string, initialData: T[]): T[] {
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data) as T[];
  }
  writeTable(key, initialData);
  return initialData;
}

/** 把一整張資料表寫回去 */
export function writeTable<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows));
}

/** 重置資料：清掉所有資料表與目前使用者後重新整理頁面，重新放入預設資料（開發用） */
export function resetData() {
  for (const key of Object.values(TABLES)) {
    localStorage.removeItem(key);
  }
  clearCurrentUserId();
  window.location.reload();
}

/** 模擬網路延遲 */
export function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
