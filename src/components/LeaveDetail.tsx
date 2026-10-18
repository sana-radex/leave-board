import type { LeaveForm } from "../types/types";
import { statusLabels } from "../utils/label";
import Modal from "./Modal";

interface LeaveDetailProps {
  /** 要顯示的假單 */
  request: LeaveForm;
  /** 假別名稱 */
  leaveTypeName: string;
  /** 職務代理人姓名 */
  deputyName: string;
  /** 按下關閉時要做的事 */
  onClose: () => void;
}

/** 假單詳情 */
function LeaveDetail({
  request,
  leaveTypeName,
  deputyName,
  onClose,
}: LeaveDetailProps) {
  return (
    <Modal title="假單詳情">
      <dl>
        <dt>假別</dt>
        <dd>{leaveTypeName}</dd>

        <dt>開始時間</dt>
        <dd>{request.startTime}</dd>

        <dt>結束時間</dt>
        <dd>{request.endTime}</dd>

        <dt>職務代理人</dt>
        <dd>{deputyName}</dd>

        <dt>狀態</dt>
        <dd>{statusLabels[request.status]}</dd>

        <dt>備註</dt>
        <dd>{request.note || "無備註"}</dd>

        <dt>送出時間</dt>
        <dd>{request.submittedAt}</dd>
      </dl>
      <button onClick={onClose}>關閉</button>
    </Modal>
  );
}

export default LeaveDetail;
