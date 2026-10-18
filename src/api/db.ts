/** 每張資料表在 localStorage 裡的名字 */
export const TABLES = {
  departmentList: "departmentList",
  employeeList: "employeeList",
  leaveTypeList: "leaveTypeList",
  leaveFormList: "leaveFormList",
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

/** 模擬網路延遲 */
export function delay() {
  return new Promise((resolve) => setTimeout(resolve, 500));
}