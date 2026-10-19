import { useEffect, useState } from "react";
import "./CalendarPage.css";
import type {
  CalendarDay,
  LeaveFormResponse,
  LeaveQuotaResponse,
  Response,
} from "../types/types";
import { getCalendarLeaveList } from "../api/leaveFormApi";
import { getCalendarDayList } from "../api/calendarApi";
import { getMyQuota } from "../api/quotaApi";
import { today } from "../utils/today";
import Calendar from "../components/Calendar";
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
              <button onClick={() => changeMonth(-1)}>⬅</button>
              <span className="calendar-month">
                {year} / {month + 1}
              </span>
              <button onClick={() => changeMonth(1)}>⮕</button>
            </div>
            <button onClick={goToToday}>今天</button>
          </div>

          <div className="calendar-legend">
            <span className="tag tag-mine">我的假單</span>
            <span className="tag tag-approved">其他人的假單</span>
            <span className="tag tag-revoked">已撤銷</span>
            <span className="tag tag-holiday">國定假日</span>
          </div>

          {loading && <p>載入中...</p>}

          <Calendar
            year={year}
            month={month}
            leaves={leaveList}
            calendarDays={calendarDayList}
            onSelectLeave={setSelectedId}
          />
        </div>

        <QuotaPanel quotaList={quotaList} />
      </div>

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
