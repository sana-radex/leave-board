import { useState } from "react";
import Modal from "./Modal";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  /** 標題，例如「確定要退回嗎？」 */
  title: string;
  /** 說明文字，例如哪一張假單 */
  message: string;
  /** 確認按鈕文字 */
  confirmText: string;
  /** 確認按鈕的 class，用來換顏色，例如 "button-reject button-solid" */
  confirmClassName: string;
  /** 備註欄位的提示文字 */
  notePlaceholder: string;
  /** 送出中：按鈕先不能按 */
  busy: boolean;
  /** 按下確認，把備註交回去 */
  onConfirm: (note: string) => void;
  /** 按下取消 */
  onCancel: () => void;
}

/** 確認視窗：執行前再確認一次，可以填備註（選填） */
function ConfirmDialog({
  title,
  message,
  confirmText,
  confirmClassName,
  notePlaceholder,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [note, setNote] = useState("");

  return (
    <Modal
      title={title}
      onClose={onCancel}
      closeDisabled={busy}
      actions={
        <>
          <button type="button" onClick={onCancel} disabled={busy}>
            取消
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={() => onConfirm(note)}
            disabled={busy}
          >
            {busy ? "處理中..." : confirmText}
          </button>
        </>
      }
    >
      <p>{message}</p>
      <textarea
        className="confirm-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={notePlaceholder}
      ></textarea>
    </Modal>
  );
}

export default ConfirmDialog;
