import type { FormAction } from "../types/domain";
import type {
  AddLeaveFormRequest,
  AddLeaveFormResponse,
  InboxResponse,
  LeaveFormOptionsResponse,
  LeaveFormPreviewResponse,
  LeaveFormResponse,
  Response,
} from "../types/api";
import * as userService from "../services/userService";
import * as leaveFormService from "../services/leaveFormService";
import { delay } from "./delay";
import { actionDoneMessages, actionLabels } from "../utils/label";
import { now, today } from "../utils/today";

/** 取得我的假單：依送出時間由新到舊 */
export async function getMyLeaveFormList(): Promise<LeaveFormResponse[]> {
  await delay();
  return leaveFormService.listMine(userService.getCurrentUser());
}

/**
 * 取得行事曆上的假單：自己的所有狀態都回傳；
 * 其他人的只回傳其他人看得到的狀態
 */
export async function getCalendarLeaveList(): Promise<LeaveFormResponse[]> {
  await delay();
  return leaveFormService.listForCalendar(userService.getCurrentUser());
}

/** 取得新增請假表單的選項：班別、時間、假別、喪假親屬、職務代理人、審核人 */
export async function getLeaveFormOptions(): Promise<LeaveFormOptionsResponse> {
  await delay();
  return leaveFormService.getOptions(userService.getCurrentUser());
}

/** 試算：填表時即時算時數、可用額度、檢查錯誤，不會存檔 */
export async function previewLeaveForm(
  input: AddLeaveFormRequest,
): Promise<LeaveFormPreviewResponse> {
  await delay(200);
  return leaveFormService.preview(userService.getCurrentUser(), input, today());
}

/** 送出假單：重新驗證一次，通過才存成待審核 */
export async function addLeaveForm(
  input: AddLeaveFormRequest,
): Promise<AddLeaveFormResponse> {
  await delay();
  const result = leaveFormService.submit(
    userService.getCurrentUser(),
    input,
    today(),
    now(),
  );
  if (!result.ok) {
    return {
      success: false,
      message: "請修正表單上的錯誤",
      errors: result.errors,
    };
  }
  return { success: true, message: "已送出，等待審核人審核", errors: {} };
}

/**
 * 執行假單動作：核准、退回、撤銷、申請撤銷、同意撤銷、不同意撤銷
 * 後端一律重新檢查：目前使用者是不是能做這個動作、假單狀態對不對
 */
export async function performLeaveAction(
  formId: string,
  action: FormAction,
  note: string,
): Promise<Response> {
  await delay();
  const result = leaveFormService.performAction(
    userService.getCurrentUser(),
    formId,
    action,
    note,
    now(),
  );
  if (!result.ok && result.reason === "not_found") {
    return { success: false, message: "找不到這張假單" };
  }
  if (!result.ok) {
    return {
      success: false,
      message: `這張假單目前不能「${actionLabels[action]}」，請重新整理後再試`,
    };
  }
  return { success: true, message: actionDoneMessages[action] };
}

/** 取得待我處理：待審申請、撤銷申請 */
export async function getInboxList(): Promise<InboxResponse> {
  await delay();
  return leaveFormService.getInbox(userService.getCurrentUser());
}

/** 取得待我處理的數量（導覽列用）：待審申請 + 撤銷申請 */
export async function getInboxCount(): Promise<number> {
  await delay();
  return leaveFormService.countInbox(userService.getCurrentUser());
}
