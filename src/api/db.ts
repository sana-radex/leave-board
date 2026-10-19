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

/** 資料版本：改了型別或預設資料就加 1，舊版本的資料會在啟動時自動清掉 */
const DATA_VERSION = "3";
const DATA_VERSION_KEY = "dataVersion";

/** 舊版本用過、現在不用的 key */
const OLD_KEYS = ["auth", "departmentList"];

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

/** 清除所有資料表與目前使用者，下次讀取時會重新放入預設資料 */
function clearAllData() {
  for (const key of [...Object.values(TABLES), ...OLD_KEYS]) {
    localStorage.removeItem(key);
  }
  clearCurrentUserId();
}

/** 啟動時檢查資料版本：版本不同就清掉舊資料 */
export function checkDataVersion() {
  if (localStorage.getItem(DATA_VERSION_KEY) !== DATA_VERSION) {
    clearAllData();
    localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  }
}

/** 重置資料：清掉所有資料後重新整理頁面（開發用） */
export function resetData() {
  clearAllData();
  window.location.reload();
}

/** 模擬網路延遲 */
export function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
