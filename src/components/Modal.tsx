import type { ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  /** 視窗標題 */
  title: string;
  /** 視窗裡面要放的東西 */
  children: ReactNode;
}

/** 彈出視窗的外框 */
function Modal({ title, children }: ModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export default Modal;