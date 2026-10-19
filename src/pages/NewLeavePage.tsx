import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router";
import "./NewLeavePage.css";
import type {
  AddLeaveFormRequest,
  LeaveFormField,
  LeaveFormOptionsResponse,
  LeaveFormPreviewResponse,
  LeaveTypeId,
  Response,
  Shift,
} from "../types/types";
import {
  addLeaveForm,
  getLeaveFormOptions,
  previewLeaveForm,
} from "../api/leaveFormApi";
import Toast from "../components/Toast";
import { formatDate, formatHours, formatTime } from "../utils/format";

/** 還沒有試算結果時用的空白結果 */
const EMPTY_PREVIEW: LeaveFormPreviewResponse = {
  days: [],
  hours: 0,
  errors: {},
  quotaLines: [],
  deductions: [],
};

/** 新增請假 */
function NewLeavePage() {
  const navigate = useNavigate();
  const [options, setOptions] = useState<LeaveFormOptionsResponse | null>(null);

  // 表單欄位
  const [leaveTypeId, setLeaveTypeId] = useState<LeaveTypeId | "">("");
  const [relationId, setRelationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deputyId, setDeputyId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [note, setNote] = useState("");

  // 試算結果：時數、每日明細、各欄位錯誤
  const [preview, setPreview] = useState<LeaveFormPreviewResponse | null>(null);
  // 按過送出才顯示錯誤；之後改欄位，錯誤跟著試算即時更新
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Response | null>(null);

  const leaveType = options?.leaveTypes.find((type) => type.id === leaveTypeId);
  const isDayUnit = leaveType?.unit === "day";
  const relation = options?.relations.find((item) => item.id === relationId);

  // 首次進入，抓表單選項
  useEffect(() => {
    async function loadOptions() {
      setOptions(await getLeaveFormOptions());
    }
    loadOptions();
  }, []);

  // 欄位改變後 300ms 試算一次（打字中不會一直呼叫）
  useEffect(() => {
    if (!options) return;
    let ignore = false; // 欄位又變了，舊的試算結果就不要用
    const timer = setTimeout(async () => {
      const result = await previewLeaveForm({
        leaveTypeId,
        relationId,
        startDate,
        startTime: isDayUnit ? null : startTime,
        endDate,
        endTime: isDayUnit ? null : endTime,
        deputyId,
        reviewerId,
        note: "", // 備註不影響試算
      });
      if (!ignore) {
        setPreview(result);
      }
    }, 300);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    options,
    leaveTypeId,
    relationId,
    startDate,
    startTime,
    endDate,
    endTime,
    deputyId,
    reviewerId,
    isDayUnit,
  ]);

  // 顯示 toast 訊息, 3 秒後自動消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 顯示某個欄位的錯誤訊息（按過送出才顯示） */
  function renderError(field: LeaveFormField) {
    const message = preview?.errors[field];
    if (!message || !submitted) {
      return null;
    }
    return <p className="field-error">{message}</p>;
  }

  /** 換假別：時間輸入方式可能不同，清空起訖 */
  function handleLeaveTypeChange(value: LeaveTypeId | "") {
    setLeaveTypeId(value);
    setRelationId("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
  }

  /** 送出 */
  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setSubmitting(true);

    const request: AddLeaveFormRequest = {
      leaveTypeId,
      relationId,
      startDate,
      startTime: isDayUnit ? null : startTime,
      endDate,
      endTime: isDayUnit ? null : endTime,
      deputyId,
      reviewerId,
      note,
    };
    const result = await addLeaveForm(request);
    setSubmitting(false);

    if (result.success) {
      // 導向我的假單，並把成功訊息帶過去
      navigate("/my-leaves", { state: { toast: result } });
      return;
    }
    setToast(result);
    // 用送出時的檢查結果更新錯誤訊息
    setPreview({ ...(preview ?? EMPTY_PREVIEW), errors: result.errors });
  }

  if (!options) {
    return <p>載入中...</p>;
  }

  return (
    <>
      {toast && <Toast success={toast.success} message={toast.message} />}

      <h1>新增請假</h1>

      <form className="leave-form" onSubmit={handleSubmit} noValidate>
        <label>
          假別
          <select
            value={leaveTypeId}
            onChange={(e) =>
              handleLeaveTypeChange(e.target.value as LeaveTypeId | "")
            }
          >
            <option value="">請選擇假別</option>
            {options.leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        {renderError("leaveTypeId")}

        {leaveTypeId === "bereavement" && (
          <>
            <label>
              親屬關係
              <select
                value={relationId}
                onChange={(e) => setRelationId(e.target.value)}
              >
                <option value="">請選擇親屬關係</option>
                {options.relations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            {relation && (
              <p className="field-hint">該次可請 {relation.days} 日</p>
            )}
            {renderError("relationId")}
          </>
        )}

        <div className="date-time-row">
          <label>
            起始日期
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          {!isDayUnit && (
            <label>
              起始時間
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="">請選擇</option>
                {options.timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {renderError("start")}

        <div className="date-time-row">
          <label>
            結束日期
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          {!isDayUnit && (
            <label>
              結束時間
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                <option value="">請選擇</option>
                {options.timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {renderError("end")}

        {/* 系統試算：時數、可用額度，跟要填的欄位分開 */}
        <section className="leave-preview" aria-live="polite">
          <div className="hours-field">
            時數（系統計算）
            <p className="hours-value">
              {preview && preview.hours > 0 ? formatHours(preview.hours) : "—"}
            </p>
            {preview && preview.days.length > 1 && (
              <details>
                <summary>每日明細</summary>
                <ul>
                  {preview.days.map((day) => (
                    <li key={day.date}>
                      {formatDate(day.date)} {formatTime(day.startTime)}–
                      {formatTime(day.endTime)}：{formatHours(day.hours)}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          {renderError("hours")}

          <div className="hours-field">
            可用額度
            {preview && preview.quotaLines.length > 0 ? (
              preview.quotaLines.map((line) => (
                <p key={line.label} className="quota-line">
                  {line.remaining === null
                    ? `該次可請 ${formatHours(line.available)}`
                    : `${line.label}可用 ${formatHours(line.available)}，${
                        line.remaining < 0
                          ? `不足 ${formatHours(-line.remaining)}`
                          : `送出後剩 ${formatHours(line.remaining)}`
                      }`}
                </p>
              ))
            ) : (
              <p className="quota-line">選好假別與起訖後顯示</p>
            )}
            {preview && preview.deductions.length > 0 && (
              <ul>
                {preview.deductions.map((item) => (
                  <li key={`${item.batchName}-${item.date}`}>
                    {formatDate(item.date)} 扣 {item.batchName}{" "}
                    {formatHours(item.hours)}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {renderError("quota")}
        </section>

        <label>
          職務代理人
          <select
            value={deputyId}
            onChange={(e) => setDeputyId(e.target.value)}
          >
            <option value="">請選擇職務代理人</option>
            {options.deputies.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </label>
        {renderError("deputyId")}

        <label>
          審核人
          <select
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
          >
            <option value="">請選擇審核人</option>
            {options.reviewers.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </label>
        {renderError("reviewerId")}

        <label>
          備註
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="請輸入備註"
          ></textarea>
        </label>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/my-leaves")}>
            取消
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={submitting}
          >
            {submitting ? "送出中..." : "送出"}
          </button>
        </div>
      </form>
    </>
  );
}

export default NewLeavePage;
