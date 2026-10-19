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
import {
  formatDate,
  formatHours,
  formatMonthDay,
  formatTime,
} from "../utils/format";

/** 還沒有試算結果時用的空白結果 */
const EMPTY_PREVIEW: LeaveFormPreviewResponse = {
  days: [],
  hours: 0,
  errors: {},
  warnings: {},
  quotaLines: [],
  deductions: [],
  retroDeadline: null,
};

/** 班別文字，例如「標準班 9:00–18:00（可選 9:00–19:00）」「午班 13:00–22:00」 */
function getShiftText(shift: Shift): string {
  const fullDay = `${formatTime(shift.fullDayStart)}–${formatTime(shift.fullDayEnd)}`;
  const selectable = `${formatTime(shift.selectableStart)}–${formatTime(shift.selectableEnd)}`;
  if (fullDay === selectable) {
    return `${shift.name} ${fullDay}`;
  }
  return `${shift.name} ${fullDay}（可選 ${selectable}）`;
}

/** 新增請假（F-02） */
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
  // 改過的欄位才顯示錯誤；按過送出後全部顯示
  const [touched, setTouched] = useState<LeaveFormField[]>([]);
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

  /** 記下這個欄位改過了 */
  function touch(field: LeaveFormField) {
    if (!touched.includes(field)) {
      setTouched([...touched, field]);
    }
  }

  /** 顯示某個欄位的錯誤訊息（改過或按過送出才顯示） */
  function renderError(field: LeaveFormField) {
    const message = preview?.errors[field];
    // 時數、可用額度是從起訖算出來的：起訖都改過才算改過
    const isTouched =
      field === "hours" || field === "quota"
        ? touched.includes("start") && touched.includes("end")
        : touched.includes(field);
    if (!message || (!submitted && !isTouched)) {
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
    touch("leaveTypeId");
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
      <p className="shift-info">班別：{getShiftText(options.shift)}</p>

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
                onChange={(e) => {
                  setRelationId(e.target.value);
                  touch("relationId");
                }}
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
              onChange={(e) => {
                setStartDate(e.target.value);
                touch("start");
              }}
            />
          </label>
          {!isDayUnit && (
            <label>
              起始時間
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  touch("start");
                }}
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
        {/* 起始日期早於今天就是補請，顯示補請期限（RETRO-01） */}
        {preview?.retroDeadline && (
          <p className="field-hint">
            補請期限：{formatMonthDay(preview.retroDeadline)}
          </p>
        )}
        {renderError("start")}

        <div className="date-time-row">
          <label>
            結束日期
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                touch("end");
              }}
            />
          </label>
          {!isDayUnit && (
            <label>
              結束時間
              <select
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  touch("end");
                }}
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

        <label>
          職務代理人
          <select
            value={deputyId}
            onChange={(e) => {
              setDeputyId(e.target.value);
              touch("deputyId");
            }}
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
        {/* 職務代理人同時段也請假：只提醒，不擋送出（VAL-10） */}
        {preview?.warnings.deputyId && (
          <p className="field-warning">{preview.warnings.deputyId}</p>
        )}

        <label>
          審核人
          <select
            value={reviewerId}
            onChange={(e) => {
              setReviewerId(e.target.value);
              touch("reviewerId");
            }}
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
          <button type="submit" disabled={submitting}>
            {submitting ? "送出中..." : "送出"}
          </button>
        </div>
      </form>
    </>
  );
}

export default NewLeavePage;
