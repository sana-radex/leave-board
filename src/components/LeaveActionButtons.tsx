import { useState } from "react";
import type { FormAction } from "../types/domain";
import type { LeaveFormResponse, Response } from "../types/api";
import { performLeaveAction } from "../api/leaveFormApi";
import { ACTION_LABELS } from "../utils/label";
import { formatLeaveRange } from "../utils/format";
import ConfirmDialog from "./ConfirmDialog";

/** 備註欄位的提示文字：退回時是退回理由、申請撤銷時是撤銷理由 */
const NOTE_PLACEHOLDERS: Record<FormAction, string> = {
  approve: "備註（選填）",
  reject: "退回理由（選填）",
  revoke: "備註（選填）",
  request_revoke: "撤銷理由（選填）",
  approve_revoke: "備註（選填）",
  reject_revoke: "備註（選填）",
};

/** 按鈕顏色：同意是松綠、拒絕是紅、撤回自己的假單是琥珀 */
const ACTION_CLASS_NAMES: Record<FormAction, string> = {
  approve: "button-approve",
  approve_revoke: "button-approve",
  reject: "button-reject",
  reject_revoke: "button-reject",
  revoke: "button-revoke",
  request_revoke: "button-revoke",
};

interface LeaveActionButtonsProps {
  /** 哪一張假單 */
  form: LeaveFormResponse;
  /** 動作做完（成功或失敗）時要做的事，例如顯示訊息、重新載入 */
  onDone: (result: Response) => void;
}

/**
 * 假單動作按鈕：依 API 回傳的 actions 顯示（撤銷、申請撤銷、核准、退回…），
 * 按下後先跳確認視窗，可以填備註，確認後才真的執行
 */
function LeaveActionButtons({ form, onDone }: LeaveActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<FormAction | null>(null);
  const [busy, setBusy] = useState(false);

  /** 確認視窗按下確認：執行動作 */
  async function handleConfirm(note: string) {
    if (!confirmAction) return;
    setBusy(true);
    const result = await performLeaveAction(form.id, confirmAction, note);
    setBusy(false);
    setConfirmAction(null);
    onDone(result);
  }

  return (
    <>
      {form.actions.map((action) => (
        <button
          key={action}
          className={ACTION_CLASS_NAMES[action]}
          onClick={() => setConfirmAction(action)}
        >
          {ACTION_LABELS[action]}
        </button>
      ))}

      {confirmAction && (
        <ConfirmDialog
          title={`確定要${ACTION_LABELS[confirmAction]}嗎？`}
          message={`${form.employeeName} ${form.leaveTypeName} ${formatLeaveRange(
            form.startTime,
            form.endTime,
            form.leaveTypeUnit,
          )}`}
          confirmText={ACTION_LABELS[confirmAction]}
          confirmClassName={`${ACTION_CLASS_NAMES[confirmAction]} button-solid`}
          notePlaceholder={NOTE_PLACEHOLDERS[confirmAction]}
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  );
}

export default LeaveActionButtons;
