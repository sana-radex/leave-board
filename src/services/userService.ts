import type { Employee } from "../types/domain";
import type { UserOptionResponse } from "../types/api";
import * as employeeRepository from "../repositories/employeeRepository";
import * as shiftRepository from "../repositories/shiftRepository";
import * as currentUserRepository from "../repositories/currentUserRepository";

/**
 * 查出目前使用者。
 * 每次都用存著的 id 重新讀人員表；沒選過或找不到這個人，就用第一位。
 */
export function getCurrentUser(): Employee {
  const employees = employeeRepository.findAll();
  const savedId = currentUserRepository.loadCurrentUserId();
  const user = employees.find((emp) => emp.id === savedId);
  return user ?? employees[0];
}

export function switchCurrentUser(id: string): Employee {
  currentUserRepository.saveCurrentUserId(id);
  return getCurrentUser();
}

export function getUserOptions(): UserOptionResponse[] {
  const employees = employeeRepository.findAll();
  const shifts = shiftRepository.findAll();
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
