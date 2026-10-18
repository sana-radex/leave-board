import type { LeaveFormResponse } from "../types/types";
import { statusLabels } from "../utils/label";
import { formatDateTime } from "../utils/format";
import Modal from "./Modal";

interface LeaveDetailProps {
  /** 要顯示的假單 */
  request: LeaveFormResponse;
  /** 按下關閉時要做的事 */
  onClose: () => void;
}

/** 假單詳情 */
function LeaveDetail({ request, onClose }: LeaveDetailProps) {
  return (
    <Modal title="假單詳情">
      <dl>
        <dt>申請人</dt>
        <dd>{request.employeeName}</dd>

        <dt>假別</dt>
        <dd>{request.leaveTypeName}</dd>

        <dt>開始時間</dt>
        <dd>{formatDateTime(request.startTime)}</dd>

        <dt>結束時間</dt>
        <dd>{formatDateTime(request.endTime)}</dd>

        <dt>職務代理人</dt>
        <dd>{request.deputyName}</dd>

        <dt>狀態</dt>
        <dd>{statusLabels[request.status]}</dd>

        <dt>備註</dt>
        <dd>{request.note || "無備註"}</dd>

        <dt>送出時間</dt>
        <dd>{formatDateTime(request.submittedAt)}</dd>
      </dl>
      <button onClick={onClose}>關閉</button>
    </Modal>
  );
}

export default LeaveDetail;
