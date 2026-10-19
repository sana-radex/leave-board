import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import "./MyLeavesPage.css";
import type { Response, LeaveFormResponse, LeaveStatus } from "../types/types";
import { getMyLeaveFormList, revokeLeaveForm } from "../api/leaveFormApi";
import Toast from "../components/Toast";
import LeaveDetail from "../components/LeaveDetail";
import { statusLabels } from "../utils/label";
import { formatDateTime, formatHours, formatLeaveRange } from "../utils/format";

/** 我的假單（F-03） */
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

  // 篩選後的假單
  const filteredList =
    statusFilter === "all"
      ? formList
      : formList.filter((form) => form.status === statusFilter);

  // 正在看詳情的假單
  const selectedForm = formList.find((form) => form.id === selectedId);

  /** 取得假單資料 */
  async function getData() {
    const list = await getMyLeaveFormList();
    setFormList(list);
    setLoading(false);
  }

  // 首次進入，抓我的假單
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

  // 顯示 toast 訊息, 3 秒後自動消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 撤銷假單 */
  async function handleRevoke(id: string) {
    const res = await revokeLeaveForm(id);
    setToast(res);
    if (res.success) {
      await getData();
    }
  }

  return (
    <>
      {toast && <Toast success={toast.success} message={toast.message} />}

      <h1>我的假單</h1>

      <div className="my-leaves-toolbar">
        <button onClick={() => navigate("/leave/new")}>新增請假</button>
        <label>
          篩選狀態：
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as LeaveStatus | "all")
            }
          >
            <option value="all">全部</option>
            {Object.entries(statusLabels).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {loading ? <p>載入中...</p> : <p>共有 {filteredList.length} 筆假單</p>}
      </div>

      <table>
        <thead>
          <tr>
            <th>假別</th>
            <th>起訖</th>
            <th>時數</th>
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
                {formatLeaveRange(
                  form.startTime,
                  form.endTime,
                  form.leaveTypeUnit,
                )}
              </td>
              <td>{formatHours(form.hours)}</td>
              <td>{statusLabels[form.status]}</td>
              <td>{form.reviewerName}</td>
              <td>{formatDateTime(form.submittedAt)}</td>
              <td>
                {form.status === "pending" && (
                  <button onClick={() => handleRevoke(form.id)}>撤銷</button>
                )}
                <button onClick={() => setSelectedId(form.id)}>詳情</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedForm && (
        <LeaveDetail
          leaveFormResponse={selectedForm}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

export default MyLeavesPage;
