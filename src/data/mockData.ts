import type {
  Employee,
  LeaveType,
  LeaveForm,
  Department,
  CalendarDay,
} from "../types/types";

export const departmentList: Department[] = [
  { id: "2", name: "研發部" },
];

export const employeeList: Employee[] = [
  {
    id: "1",
    name: "Alice",
    email: "alice@example.com",
    birthday: "1990-01-01",
    hireDate: "2020-01-01",
    departmentId: "2",
    role: "employee",
  },
  {
    id: "2",
    name: "Bob",
    email: "bob@example.com",
    birthday: "1990-01-01",
    hireDate: "2020-01-01",
    departmentId: "2",
    role: "manager",
  },
  {
    id: "4",
    name: "David",
    email: "david@example.com",
    birthday: "1990-01-01",
    hireDate: "2020-01-01",
    departmentId: "2",
    role: "employee",
  },
];

export const leaveTypeList: LeaveType[] = [
  {
    id: "personal",
    name: "事假",
    description: "因個人原因申請的假期",
  },
  {
    id: "sick",
    name: "病假",
    description: "因生病而申請的假期",
  },
  {
    id: "annual",
    name: "特休",
    description: "每年享有的特別休假",
  },
];

export const leaveFormList: LeaveForm[] = [
  {
    id: "1",
    employeeId: "1",
    leaveTypeId: "personal",
    status: "approved",
    startTime: "2023-10-01T09:00",
    endTime: "2023-10-01T17:00",
    deputyId: "2",
    note: "有事要處理",
    submittedAt: "2023-10-01T10:00:00.000Z",
  },
  {
    id: "2",
    employeeId: "2",
    leaveTypeId: "sick",
    status: "approved",
    startTime: "2023-10-02T09:00",
    endTime: "2023-10-02T17:00",
    deputyId: "1",
    note: "腸胃炎",
    submittedAt: "2023-10-02T10:00:00.000Z",
  },
  {
    id: "4",
    employeeId: "2",
    leaveTypeId: "annual",
    status: "pending",
    startTime: "2026-10-21T09:00",
    endTime: "2026-10-23T18:00",
    deputyId: "4",
    note: "出國旅遊",
    submittedAt: "2026-10-12T03:00:00.000Z",
  },
  {
    id: "5",
    employeeId: "4",
    leaveTypeId: "sick",
    status: "revoked",
    startTime: "2026-10-27T13:00",
    endTime: "2026-10-27T18:00",
    deputyId: "1",
    note: "看醫生",
    submittedAt: "2026-10-13T01:30:00.000Z",
  },
  {
    id: "6",
    employeeId: "1",
    leaveTypeId: "annual",
    status: "approved",
    startTime: "2026-10-29T09:00",
    endTime: "2026-11-02T18:00",
    deputyId: "4",
    note: "連假出遊",
    submittedAt: "2026-10-05T06:00:00.000Z",
  },
];

/** 辦公日曆（2026 年） */
export const calendarDayList: CalendarDay[] = [
  { date: "2026-01-01", type: "holiday", name: "開國紀念日" },
  { date: "2026-02-15", type: "holiday", name: "小年夜" },
  { date: "2026-02-16", type: "holiday", name: "除夕" },
  { date: "2026-02-17", type: "holiday", name: "春節" },
  { date: "2026-02-18", type: "holiday", name: "春節" },
  { date: "2026-02-19", type: "holiday", name: "春節" },
  { date: "2026-02-20", type: "holiday", name: "春節補假" },
  { date: "2026-02-27", type: "holiday", name: "和平紀念日補假" },
  { date: "2026-02-28", type: "holiday", name: "和平紀念日" },
  { date: "2026-04-03", type: "holiday", name: "兒童節補假" },
  { date: "2026-04-04", type: "holiday", name: "兒童節" },
  { date: "2026-04-05", type: "holiday", name: "民族掃墓節" },
  { date: "2026-04-06", type: "holiday", name: "民族掃墓節補假" },
  { date: "2026-05-01", type: "holiday", name: "勞動節" },
  { date: "2026-06-19", type: "holiday", name: "端午節" },
  { date: "2026-09-25", type: "holiday", name: "中秋節" },
  { date: "2026-09-28", type: "holiday", name: "教師節" },
  { date: "2026-10-09", type: "holiday", name: "國慶日補假" },
  { date: "2026-10-10", type: "holiday", name: "國慶日" },
  { date: "2026-10-25", type: "holiday", name: "光復節" },
  { date: "2026-10-26", type: "holiday", name: "光復節補假" },
  { date: "2026-12-25", type: "holiday", name: "行憲紀念日" },
  { date: "2026-11-07", type: "makeup_workday", name: "補行上班（示範）" },
];
