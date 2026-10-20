import type { Employee } from "../types/domain";
import type { UserOptionResponse } from "../types/api";
import * as userService from "../services/userService";
import { delay } from "./delay";

/** 取得目前使用者 */
export async function getCurrentUserInfo(): Promise<Employee> {
  await delay();
  return userService.getCurrentUser();
}

/** 切換目前使用者，回傳切換後的使用者 */
export async function switchUser(employeeId: string): Promise<Employee> {
  await delay();
  return userService.switchCurrentUser(employeeId);
}

/** 取得使用者切換的選項：姓名、角色、班別 */
export async function getUserOptionList(): Promise<UserOptionResponse[]> {
  await delay();
  return userService.getUserOptions();
}
