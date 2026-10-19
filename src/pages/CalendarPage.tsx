import { useEffect, useState } from "react";
import "./CalendarPage.css";
import type {
  CalendarDay,
  CalendarFilter,
  LeaveFormResponse,
  LeaveQuotaResponse,
  Response,
} from "../types/types";
import { getCalendarLeaveList } from "../api/leaveFormApi";
import { getCalendarDayList } from "../api/calendarApi";
import { getMyQuota } from "../api/quotaApi";
import { today } from "../utils/today";
import Calendar from "../components/Calendar";
import CalendarFilterModal from "../components/CalendarFilterModal";
import LeaveDetail from "../components/LeaveDetail";
import QuotaPanel from "../components/QuotaPanel";
import Toast from "../components/Toast";

interface CalendarPageProps {
  /** 假單狀態變了（例如在詳情裡同意撤銷），讓上層更新待我處理的數量 */
  onLeaveChanged: () => void;
}

/** 請假行事曆（F-06） */
function CalendarPage({ onLeaveChanged }: CalendarPageProps) {
  const [todayYear, todayMonth] = today().split("-").map(Number);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Response | null>(null);
  const [leaveList, setLeaveList] = useState<LeaveFormResponse[]>([]);
  const [calendarDayList, setCalendarDayList] = useState<CalendarDay[]>([]);
  // 右邊的我的額度：只放批次型（特休、彈性假、生日假）
  const [quotaList, setQuotaList] = useState<LeaveQuotaResponse[]>([]);
  // 正在看的月份：存那個月的 1 號
  const [viewDate, setViewDate] = useState(
    new Date(todayYear, todayMonth - 1, 1),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 篩選條件：預設全部都顯示
  const [filter, setFilter] = useState<CalendarFilter>({
    mine: true,
    others: true,
    revoked: true,
    holiday: true,
    makeup_workday: true,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0 = 1 月，11 = 12 月

  // 正在看詳情的假單
  const selectedLeave = leaveList.find((leave) => leave.id === selectedId);

  /** 換月份：-1 是上個月，+1 是下個月 */
  function changeMonth(offset: number) {
    // 月份超過 12 月或小於 1 月，Date 會自動換年
    setViewDate(new Date(year, month + offset, 1));
  }

  /** 回到今天所在的月份 */
  function goToToday() {
    setViewDate(new Date(todayYear, todayMonth - 1, 1));
  }

  /** 圖例標籤的 class：沒有顯示的類別加上 legend-hidden */
  function getLegendClassName(tagClassName: string, shown: boolean) {
    let className = `tag ${tagClassName}`;
    if (!shown) {
      className += " legend-hidden";
    }
    return className;
  }

  /** 篩選視窗按下套用：換成新的條件並關掉視窗 */
  function handleFilterApply(newFilter: CalendarFilter) {
    setFilter(newFilter);
    setFilterOpen(false);
  }

  /** 取得我的額度，只留批次型 */
  async function getBatchQuotaList() {
    const list = await getMyQuota();
    return list.filter((quota) => quota.quotaType === "batch");
  }

  // 首次進入，抓行事曆上的假單、辦公日曆、我的額度
  useEffect(() => {
    async function loadData() {
      const [leaves, calendarDays, quota] = await Promise.all([
        getCalendarLeaveList(),
        getCalendarDayList(),
        getBatchQuotaList(),
      ]);
      setLeaveList(leaves);
      setCalendarDayList(calendarDays);
      setQuotaList(quota);
      setLoading(false);
    }
    loadData();
  }, []);

  // 顯示 toast 訊息, 3 秒後自動消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** 在詳情裡做完動作：顯示訊息、重新載入假單與額度、通知上層 */
  async function handleActionDone(result: Response) {
    setToast(result);
    if (result.success) {
      const [leaves, quota] = await Promise.all([
        getCalendarLeaveList(),
        getBatchQuotaList(),
      ]);
      setLeaveList(leaves);
      setQuotaList(quota);
      onLeaveChanged();
    }
  }

  return (
    <>
      {toast && <Toast success={toast.success} message={toast.message} />}

      <h1>請假行事曆</h1>

      {/* 左邊行事曆，右邊我的額度 */}
      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="calendar-toolbar">
            <div className="month-switcher">
              <button className="toolbar-button" onClick={goToToday}>
                今天
              </button>
              <button
                className="month-button"
                onClick={() => changeMonth(-1)}
                aria-label="上個月"
                title="上個月"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M10 3L5 8l5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="calendar-month">
                {year} 年 {month + 1} 月
              </span>
              <button
                className="month-button"
                onClick={() => changeMonth(1)}
                aria-label="下個月"
                title="下個月"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M6 3l5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <button
              className="toolbar-button filter-button"
              onClick={() => setFilterOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M2.5 3.5h11l-4.25 5v4l-2.5 1.25V8.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              篩選條件
            </button>
          </div>

          {/* 圖例：被篩掉的類別變淡、加刪除線，看得出現在有隱藏哪些 */}
          <div className="calendar-legend">
            <span className={getLegendClassName("tag-mine", filter.mine)}>
              我的假單
            </span>
            <span className={getLegendClassName("tag-approved", filter.others)}>
              其他人的假單
            </span>
            <span className={getLegendClassName("tag-revoked", filter.revoked)}>
              已撤銷
            </span>
            <span className={getLegendClassName("tag-holiday", filter.holiday)}>
              國定假日
            </span>
            <span
              className={getLegendClassName(
                "tag-makeup_workday",
                filter.makeup_workday,
              )}
            >
              補班日
            </span>
          </div>

          {loading && <p>載入中...</p>}

          <Calendar
            year={year}
            month={month}
            leaves={leaveList}
            calendarDays={calendarDayList}
            filter={filter}
            onSelectLeave={setSelectedId}
          />
        </div>

        <QuotaPanel quotaList={quotaList} />
      </div>

      {filterOpen && (
        <CalendarFilterModal
          filter={filter}
          onApply={handleFilterApply}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {selectedLeave && (
        <LeaveDetail
          leaveFormResponse={selectedLeave}
          onClose={() => setSelectedId(null)}
          onActionDone={handleActionDone}
        />
      )}
    </>
  );
}

export default CalendarPage;
