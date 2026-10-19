import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Modal.css";

interface ModalProps {
  /** 視窗標題 */
  title: string;
  /** 視窗裡面要放的東西 */
  children: ReactNode;
  /** 按下右上角的關閉時要做的事 */
  onClose: () => void;
  /** 右上角的關閉先不能按，例如送出中 */
  closeDisabled?: boolean;
  /** 底部的按鈕，靠右排；沒有就不顯示 */
  actions?: ReactNode;
}

/**
 * 彈出視窗的外框：標題和底部按鈕固定，中間內容太長時自己捲動。
 * 畫在 body 底下，從表格裡打開時才不會吃到表格的樣式（例如表格內按鈕縮小、不換行）
 */
function Modal({ title, children, onClose, closeDisabled, actions }: ModalProps) {
  const titleId = useId();

  return createPortal(
    <div className="modal-overlay">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <h3 className="modal-title" id={titleId}>
            {title}
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="關閉"
            title="關閉"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
