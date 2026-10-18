/** 假別 id */
export type LeaveTypeId = "personal" | "sick" | "annual"; // 事假、病假、特休

/** 假單狀態 */
export type LeaveStatus = "pending" | "approved" | "revoked";  // 待審核、已核准、已撤銷

/** 角色 */
export type Role = "general_manager" | "manager" | "employee"; // 總經理、主管、員工

/** 辦公日曆的日子類型 */
export type CalendarDayType = "holiday" | "makeup_workday"; // 放假日、補班日

/** 行事曆可以篩選的項目：假單狀態 + 辦公日曆的日子類型 */
export type CalendarFilterKey = LeaveStatus | CalendarDayType;

/** 行事曆篩選：每一項要不要顯示 */
export type CalendarFilter = Record<CalendarFilterKey, boolean>;

/** 部門 */
export interface Department {
  /** 部門 id */
  id: string;
  /** 部門名稱 */
  name: string;
}

/** 員工 */
export interface Employee {
  /** 員工 id */
  id: string;
  /** 姓名 */
  name: string;
  /** 電子郵件 */
  email: string;
  /** 生日 */
  birthday: string; // 'YYYY-MM-DD'
  /** 雇用日期 */
  hireDate: string; // 'YYYY-MM-DD'
  /** 部門 id */
  departmentId: string;
  /** 角色（manager = 自己部門的主管） */
  role: Role;
}

/** 假別 */
export interface LeaveType {
  /** 假別 id */
  id: LeaveTypeId;
  /** 假別名稱 */
  name: string;
  /** 假別描述 */
  description: string;
}

/** 假單 */
export interface LeaveForm {
  /** 假單 id */
  id: string;
  /** 員工 id */
  employeeId: string;
  /** 假別 id */
  leaveTypeId: LeaveTypeId;
  /** 假單狀態 */
  status: LeaveStatus;
  /** 開始時間 */
  startTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 結束時間 */
  endTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 職務代理人 */
  deputyId: string;
  /** 備註 */
  note: string;
  /** 送出時間 */
  submittedAt: string; // 'YYYY-MM-DDTHH:mm:ss.SSSZ'
}

/** 辦公日曆的特別日子 */
export interface CalendarDay {
  /** 日期 */
  date: string; // 'YYYY-MM-DD'
  /** 類型 */
  type: CalendarDayType;
  /** 名稱 */
  name: string;
}

/** 新增假單-請求 */
export interface AddLeaveFormRequest {
  /** 員工 id */
  employeeId: string;
  /** 假別 id */
  leaveTypeId: LeaveTypeId;
  /** 開始時間 */
  startTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 結束時間 */
  endTime: string; // 'YYYY-MM-DDTHH:mm'
  /** 職務代理人 */
  deputyId: string;
  /** 備註 */
  note: string;
}

/** 登入紀錄（後端的資料表：記住發出去的 token 是誰的；登出時刪掉） */
export interface Session {
  /** 通行證 */
  token: string;
  /** 員工 id */
  employeeId: string;
}

/** 登入資料（登入 API 回傳的，也是存在 localStorage 的） */
export interface AuthSession {
  /** 通行證：登入成功後，後端發給前端的一串字 */
  token: string;
  /** 登入的使用者 */
  user: Employee;
}

/** API 回傳格式 */
export interface Response {
  /** 成功狀態 */
  success: boolean;
  /** 要顯示給使用者看的訊息 */
  message: string;
}
