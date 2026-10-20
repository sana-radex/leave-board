import type { LeaveQuotaResponse } from "../types/api";
import * as userService from "../services/userService";
import * as quotaService from "../services/quotaService";
import { delay } from "./delay";
import { today } from "../utils/today";

/** 取得我的額度：每個假別一列，批次型附每一筆批次（只能看自己的） */
export async function getMyQuota(): Promise<LeaveQuotaResponse[]> {
  await delay();
  return quotaService.getQuotaList(userService.getCurrentUser(), today());
}
