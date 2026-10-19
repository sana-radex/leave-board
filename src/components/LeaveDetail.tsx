import type { LeaveFormResponse } from "../types/types";
import { actionLabels, statusLabels } from "../utils/label";
import {
  formatDate,
  formatDateTime,
  formatHours,
  formatLeaveRange,
} from "../utils/format";
import Modal from "./Modal";
import "./LeaveDetail.css";

interface LeaveDetailProps {
  /** 要顯示的假單 */
  leaveFormResponse: LeaveFormResponse;
  /** 按下關閉時要做的事 */
  onClose: () => void;
}

/** 假單詳情：本人、該單審核人看完整內容；其他人只看行事曆上看得到的欄位 */
function LeaveDetail({ leaveFormResponse: form, onClose }: LeaveDetailProps) {
  const range = formatLeaveRange(form.startTime, form.endTime, form.leaveTypeUnit);

  // 其他人：姓名、起訖、職務代理人、假別「請假」，已撤銷加註
  if (!form.canSeeDetail) {
    return (
      <Modal title="假單詳情">
        <dl>
          <dt>申請人</dt>
          <dd>{form.employeeName}</dd>

          <dt>假別</dt>
          <dd>{form.leaveTypeName}</dd>

          <dt>起訖</dt>
          <dd>{range}</dd>

          <dt>職務代理人</dt>
          <dd>{form.deputyName}</dd>

          {form.status === "revoked" && (
            <>
              <dt>狀態</dt>
              <dd>已撤銷</dd>
            </>
          )}
        </dl>
        <button onClick={onClose}>關閉</button>
      </Modal>
    );
  }

  return (
    <Modal title="假單詳情">
      <dl>
        <dt>申請人</dt>
        <dd>{form.employeeName}</dd>

        <dt>假別</dt>
        <dd>{form.leaveTypeName}</dd>

        {form.relationName && (
          <>
            <dt>親屬關係</dt>
            <dd>{form.relationName}</dd>
          </>
        )}

        <dt>起訖</dt>
        <dd>{range}</dd>

        <dt>時數</dt>
        <dd>{formatHours(form.hours)}</dd>

        <dt>職務代理人</dt>
        <dd>{form.deputyName}</dd>

        <dt>審核人</dt>
        <dd>{form.reviewerName}</dd>

        <dt>狀態</dt>
        <dd>{statusLabels[form.status]}</dd>

        <dt>備註</dt>
        <dd>{form.note || "無備註"}</dd>

        <dt>送出時間</dt>
        <dd>{formatDateTime(form.submittedAt)}</dd>

        {form.deductions.length > 0 && (
          <>
            <dt>扣除明細</dt>
            <dd>
              <ul className="leave-detail-list">
                {form.deductions.map((item) => (
                  <li key={`${item.batchName}-${item.date}`}>
                    {formatDate(item.date)}：{item.batchName}{" "}
                    {formatHours(item.hours)}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>

      <h4>簽核歷程</h4>
      <table>
        <thead>
          <tr>
            <th>時間</th>
            <th>執行者</th>
            <th>動作</th>
            <th>備註</th>
          </tr>
        </thead>
        <tbody>
          {form.history.map((record) => (
            <tr key={record.at}>
              <td>{formatDateTime(record.at)}</td>
              <td>{record.actorName}</td>
              <td>{actionLabels[record.action]}</td>
              <td>{record.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={onClose}>關閉</button>
    </Modal>
  );
}

export default LeaveDetail;
