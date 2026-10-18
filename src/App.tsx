import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import "./App.css";
import type {
  Response,
  Employee,
  LeaveType,
  LeaveForm,
  LeaveStatus,
  LeaveTypeId,
  Department,
} from "./types/types";
import {
  getLeaveRequestList,
  addLeaveRequest,
  revokeLeaveRequest,
} from "./api/leaveFormApi";
import { getEmployeeList } from "./api/employeeApi";
import { getLeaveTypeList } from "./api/leaveTypeApi";
import Toast from "./components/Toast";
import LeaveDetail from "./components/LeaveDetail";
import { getDepartmentList } from "./api/departmentApi";
import { statusLabels, roleLabels } from "./utils/label";
import { formatDateTime, getTimeOptions } from "./utils/format";
import Modal from "./components/Modal";

const TIME_OPTIONS = getTimeOptions();

function App() {
  const [currentUserId, setCurrentUserId] = useState("1");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("18:00");
  const [leaveTypeId, setLeaveTypeId] = useState<LeaveTypeId>("personal");
  const [deputyId, setDeputyId] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<Response | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formList, setFormList] = useState<LeaveForm[]>([]);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [leaveTypeList, setLeaveTypeList] = useState<LeaveType[]>([]);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // 篩選後的假單
  const filteredList =
    statusFilter === "all"
      ? formList
      : formList.filter((req) => req.status === statusFilter);

  // 正在看詳情的假單
  const selectedRequest = formList.find((req) => req.id === selectedId);

  /** 取得部門名稱 */
  function getDepartmentName(deptId: string): string {
    const department = departmentList.find((dept) => dept.id === deptId);
    return department ? department.name : "未知";
  }

  /** 取得假別名稱 */
  function getLeaveTypeName(typeId: LeaveTypeId): string {
    const leaveType = leaveTypeList.find((type) => type.id === typeId);
    return leaveType ? leaveType.name : "未知";
  }

  /** 取得員工名稱 */
  function getEmployeeName(empId: string): string {
    const employee = employeeList.find((emp) => emp.id === empId);
    return employee ? employee.name : "未知";
  }

  /** 取得假單資料 */
  async function getData() {
    const list = await getLeaveRequestList(currentUserId);
    setFormList(list);
    setLoading(false);
  }

  // 首次進入，抓員工、假別、部門
  useEffect(() => {
    async function firstLoad() {
      const [employees, leaveTypes, departments] = await Promise.all([
        getEmployeeList(),
        getLeaveTypeList(),
        getDepartmentList(),
      ]);
      setEmployeeList(employees);
      setLeaveTypeList(leaveTypes);
      setDepartmentList(departments);
    }
    firstLoad();
  }, []);

  // 目前使用者改變時，抓該使用者的假單
  useEffect(() => {
    async function loadMyRequests() {
      const list = await getLeaveRequestList(currentUserId);
      setFormList(list);
      setLoading(false);
    }
    loadMyRequests();
  }, [currentUserId]);

  // 顯示 toast 訊息, 3 秒後自動消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 提交假單 */
  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const result = await addLeaveRequest({
      employeeId: currentUserId,
      leaveTypeId: leaveTypeId,
      startTime: `${startDate}T${startTime}`,
      endTime: `${endDate}T${endTime}`,
      deputyId: deputyId,
      note: note,
    });
    setToast(result);

    if (result.success) {
      await getData();
      resetForm();
      setShowForm(false);
    }
    setSubmitting(false);
  }

  /** 撤銷假單 */
  async function handleRevoke(id: string) {
    const res = await revokeLeaveRequest(id, currentUserId);
    setToast(res);
    if (res.success) {
      await getData();
    }
  }

  /** 清空表單 */
  function resetForm() {
    setStartDate("");
    setStartTime("09:00");
    setEndDate("");
    setEndTime("18:00");
    setLeaveTypeId("personal");
    setDeputyId("");
    setNote("");
  }

  /** 取消新增假單 */
  function handleCancelForm() {
    resetForm();
    setShowForm(false);
  }

  /** 切換使用者 */
  function handleSwitchUser(userId: string) {
    // 轉換 id
    setCurrentUserId(userId);
    // 清空申請表單資料
    resetForm();
    // 清空列表
    setFormList([]);
    setLoading(true);
  }

  return (
    <>
      {toast && <Toast success={toast.success} message={toast.message} />}

      <header>
        <label>
          目前使用者
          <select
            value={currentUserId}
            onChange={(e) => handleSwitchUser(e.target.value)}
          >
            {employeeList.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {`${emp.name}(${getDepartmentName(emp.departmentId)}・${roleLabels[emp.role]})`}
              </option>
            ))}
          </select>
        </label>
      </header>

      <h1>我的假單</h1>
      <button onClick={() => setShowForm(true)}>新增假單</button>

      {loading ? <p>載入中...</p> : <p>共有 {filteredList.length} 筆假單</p>}
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

      <table>
        <thead>
          <tr>
            <th>假別</th>
            <th>開始日期</th>
            <th>結束日期</th>
            <th>職務代理人</th>
            <th>狀態</th>
            <th>備註</th>
            <th>提交時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredList.map((req) => (
            <tr key={req.id}>
              <td>{getLeaveTypeName(req.leaveTypeId)}</td>
              <td>{formatDateTime(req.startTime)}</td>
              <td>{formatDateTime(req.endTime)}</td>
              <td>{getEmployeeName(req.deputyId)}</td>
              <td>{statusLabels[req.status]}</td>
              <td>{req.note}</td>
              <td>{formatDateTime(req.submittedAt)}</td>
              <td>
                {req.status === "pending" && (
                  <button onClick={() => handleRevoke(req.id)}>撤銷表單</button>
                )}
                <button onClick={() => setSelectedId(req.id)}>詳細</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <Modal title="申請假單">
          <form className="leave-form" onSubmit={handleSubmit}>
            <label>
              假別
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value as LeaveTypeId)}
              >
                {leaveTypeList.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              開始日期
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>

            <label>
              開始時間
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label>
              結束日期
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>

            <label>
              結束時間
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label>
              職務代理人
              <select
                value={deputyId}
                onChange={(e) => setDeputyId(e.target.value)}
                required
              >
                <option value="">請選擇職務代理人</option>
                {employeeList
                  .filter((emp) => emp.id !== currentUserId)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              備註
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="請輸入備註"
              ></textarea>
            </label>

            <button type="button" onClick={handleCancelForm}>
              取消
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "提交假單"}
            </button>
          </form>
        </Modal>
      )}

      {selectedRequest && (
        <LeaveDetail
          request={selectedRequest}
          leaveTypeName={getLeaveTypeName(selectedRequest.leaveTypeId)}
          deputyName={getEmployeeName(selectedRequest.deputyId)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

export default App;
