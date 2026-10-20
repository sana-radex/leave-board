import type { LeaveFormResponse, Response } from "../types/types";
import { actionLabels, statusLabels } from "../utils/label";
import {
  formatDate,
  formatDateTime,
  formatHours,
  formatLeaveRange,
} from "../utils/format";
import Modal from "./Modal";
import LeaveActionButtons from "./LeaveActionButtons";
import "./LeaveDetail.css";

interface LeaveDetailProps {
  /** 要顯示的假單 */
  leaveFormResponse: LeaveFormResponse;
  /** 按下關閉時要做的事 */
  onClose: () => void;
  /** 在詳情裡做完動作（核准、撤銷…）時要做的事 */
  onActionDone: (result: Response) => void;
}

/** 假單詳情：本人、該單審核人看完整內容；其他人只看行事曆上看得到的欄位 */
function LeaveDetail({
  leaveFormResponse: form,
  onClose,
  onActionDone,
}: LeaveDetailProps) {
  const range = formatLeaveRange(form.startTime, form.endTime, form.leaveTypeUnit);

  // 其他人：姓名、假別「請假」、起訖、職務代理人
  if (!form.canSeeDetail) {
    return (
      <Modal title="假單詳情" onClose={onClose}>
        <dl className="leave-detail-fields">
          <dt>申請人</dt>
          <dd>{form.employeeName}</dd>

          <dt>假別</dt>
          <dd>{form.leaveTypeName}</dd>

          <dt>起訖</dt>
          <dd>{range}</dd>

          <dt>職務代理人</dt>
          <dd>{form.deputyName}</dd>
        </dl>
      </Modal>
    );
  }

  return (
    <Modal
      title="假單詳情"
      onClose={onClose}
      actions={
        form.actions.length > 0 && (
          <LeaveActionButtons form={form} onDone={onActionDone} />
        )
      }
    >
      <dl className="leave-detail-fields">
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
        <dd>
          <span className={`tag tag-${form.status}`}>
            {statusLabels[form.status]}
          </span>
        </dd>

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

      <h4 className="leave-detail-subtitle">簽核歷程</h4>
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
              <td className="cell-text">{record.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

export default LeaveDetail;
