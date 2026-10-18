import type { Employee, LeaveType, LeaveForm, Department } from "../types/types";

export const departmentList: Department[] = [
  { id: "1", name: "總經理室" },
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
    id: "3",
    name: "Charlie",
    email: "charlie@example.com",
    birthday: "1990-01-01",
    hireDate: "2020-01-01",
    departmentId: "1",
    role: "general_manager",
  },
  {
    id: "4",
    name: "David",
    email: "david@example.com",
    birthday: "1990-01-01",
    hireDate: "2020-01-01",
    departmentId: "2",
    role: "employee",
  }
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
    deputyId: "3",
    note: "腸胃炎",
    submittedAt: "2023-10-02T10:00:00.000Z",
  }
];
