import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import "./MyLeavesPage.css";
import type { LeaveStatus } from "../types/domain";
import type { Response, LeaveFormResponse } from "../types/api";
import { getMyLeaveFormList } from "../api/leaveFormApi";
import Toast from "../components/Toast";
import LeaveDetail from "../components/LeaveDetail";
import LeaveActionButtons from "../components/LeaveActionButtons";
import { STATUS_LABELS } from "../utils/label";
import {
  formatDateTime,
  formatHours,
  formatLeaveRange,
  keepDateTimeTogether,
} from "../utils/format";

/** 我的假單 */
function MyLeavesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  // 從新增請假頁導過來時，會帶著「已送出」的訊息
  const [toast, setToast] = useState<Response | null>(
    location.state?.toast ?? null,
  );
  const [formList, setFormList] = useState<LeaveFormResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredList =
    statusFilter === "all"
      ? formList
      : formList.filter((form) => form.status === statusFilter);

  const selectedForm = formList.find((form) => form.id === selectedId);

  /** 取得假單資料 */
  async function getData() {
    const list = await getMyLeaveFormList();
    setFormList(list);
    setLoading(false);
  }

  useEffect(() => {
    async function loadMyForms() {
      const list = await getMyLeaveFormList();
      setFormList(list);
      setLoading(false);
    }
    loadMyForms();
  }, []);

  // 帶過來的訊息用過就清掉，重新整理時才不會又跳出來
  useEffect(() => {
    if (location.state?.toast) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 撤銷、申請撤銷做完：顯示訊息、重新載入 */
  async function handleActionDone(result: Response) {
    setToast(result);
    if (result.success) {
      await getData();
    }
  }

  return (
    <>
      {toast && <Toast success={toast.success} message={toast.message} />}

      <h1>我的假單</h1>

      <div className="my-leaves-toolbar">
        <label>
          篩選狀態
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LeaveStatus | "all")
            }
          >
            <option value="all">全部</option>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {loading ? <p>載入中...</p> : <p>共有 {filteredList.length} 筆假單</p>}
        <button
          className="button-primary my-leaves-new"
          onClick={() => navigate("/leave/new")}
        >
          新增請假
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>假別</th>
              <th>起訖</th>
              <th className="cell-number">時數</th>
              <th>狀態</th>
              <th>審核人</th>
              <th>送出時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.map((form) => (
              <tr key={form.id}>
                <td>
                  {form.relationName
                    ? `${form.leaveTypeName}（${form.relationName}）`
                    : form.leaveTypeName}
                </td>
                <td>
                  {keepDateTimeTogether(
                    formatLeaveRange(
                      form.startTime,
                      form.endTime,
                      form.leaveTypeUnit,
                    ),
                  )}
                </td>
                <td className="cell-number">{formatHours(form.hours)}</td>
                <td>
                  <span className={`tag tag-${form.status}`}>
                    {STATUS_LABELS[form.status]}
                  </span>
                </td>
                <td>{form.reviewerName}</td>
                <td>{formatDateTime(form.submittedAt)}</td>
                <td className="cell-actions">
                  <button onClick={() => setSelectedId(form.id)}>詳情</button>
                  <LeaveActionButtons form={form} onDone={handleActionDone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

export default MyLeavesPage;
