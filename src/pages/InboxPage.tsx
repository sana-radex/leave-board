import { useEffect, useState } from "react";
import "./InboxPage.css";
import type {
  InboxResponse,
  LeaveFormResponse,
  Response,
} from "../types/types";
import { getInboxList } from "../api/leaveFormApi";
import Toast from "../components/Toast";
import LeaveDetail from "../components/LeaveDetail";
import LeaveActionButtons from "../components/LeaveActionButtons";
import { formatDateTime, formatHours, formatLeaveRange } from "../utils/format";

interface InboxPageProps {
  /** 處理完一筆，讓上層更新導覽列的數量 */
  onLeaveChanged: () => void;
}

/** 待我處理（F-05）：審核人是我的待審假單、撤銷申請 */
function InboxPage({ onLeaveChanged }: InboxPageProps) {
  const [loading, setLoading] = useState(true);
  const [inbox, setInbox] = useState<InboxResponse>({
    pendingList: [],
    revokeRequestList: [],
  });
  const [toast, setToast] = useState<Response | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 正在看詳情的假單（處理完就不在列表裡，詳情會自動關掉）
  const allForms: LeaveFormResponse[] = [
    ...inbox.pendingList,
    ...inbox.revokeRequestList,
  ];
  const selectedForm = allForms.find((form) => form.id === selectedId);

  // 首次進入，抓待我處理
  useEffect(() => {
    async function loadInbox() {
      setInbox(await getInboxList());
      setLoading(false);
    }
    loadInbox();
  }, []);

  // 顯示 toast 訊息, 3 秒後自動消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 處理完一筆：顯示訊息、重新載入、更新導覽列數量 */
  async function handleActionDone(result: Response) {
    setToast(result);
    if (result.success) {
      setInbox(await getInboxList());
      onLeaveChanged();
    }
  }

  /** 每一列共同的欄位：申請人、假別、起訖、時數、職務代理人、備註、送出時間 */
  function renderCommonCells(form: LeaveFormResponse) {
    return (
      <>
        <td>{form.employeeName}</td>
        <td>
          {form.relationName
            ? `${form.leaveTypeName}（${form.relationName}）`
            : form.leaveTypeName}
        </td>
        <td>
          {formatLeaveRange(form.startTime, form.endTime, form.leaveTypeUnit)}
        </td>
        <td>{formatHours(form.hours)}</td>
        <td>{form.deputyName}</td>
        <td>{form.note}</td>
        <td>{formatDateTime(form.submittedAt)}</td>
      </>
    );
  }

  /** 操作欄：詳情＋動作按鈕 */
  function renderActionCell(form: LeaveFormResponse) {
    return (
      <td className="inbox-actions">
        <button onClick={() => setSelectedId(form.id)}>詳情</button>
        <LeaveActionButtons form={form} onDone={handleActionDone} />
      </td>
    );
  }

  return (
    <>
      {toast && <Toast success={toast.success} message={toast.message} />}

      <h1>待我處理</h1>
      {loading && <p>載入中...</p>}

      <section className="inbox-section">
        <h2>待審假單（{inbox.pendingList.length}）</h2>
        {inbox.pendingList.length === 0 ? (
          <p className="inbox-empty">目前沒有待審假單</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>申請人</th>
                <th>假別</th>
                <th>起訖</th>
                <th>時數</th>
                <th>職務代理人</th>
                <th>備註</th>
                <th>送出時間</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {inbox.pendingList.map((form) => (
                <tr key={form.id}>
                  {renderCommonCells(form)}
                  {renderActionCell(form)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="inbox-section">
        <h2>撤銷申請（{inbox.revokeRequestList.length}）</h2>
        {inbox.revokeRequestList.length === 0 ? (
          <p className="inbox-empty">目前沒有撤銷申請</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>申請人</th>
                <th>假別</th>
                <th>起訖</th>
                <th>時數</th>
                <th>職務代理人</th>
                <th>備註</th>
                <th>送出時間</th>
                <th>申請撤銷時間</th>
                <th>撤銷理由</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {inbox.revokeRequestList.map((form) => (
                <tr key={form.id}>
                  {renderCommonCells(form)}
                  <td>{formatDateTime(form.requestedAt)}</td>
                  <td>{form.reason}</td>
                  {renderActionCell(form)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedForm && (
        <LeaveDetail
          leaveFormResponse={selectedForm}
          onClose={() => setSelectedId(null)}
          onActionDone={handleActionDone}
        />
      )}
    </>
  );
}

export default InboxPage;
