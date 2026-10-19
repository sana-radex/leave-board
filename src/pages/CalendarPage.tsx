import { useEffect, useState } from "react";
import "./CalendarPage.css";
import type { CalendarDay, LeaveFormResponse } from "../types/types";
import { getCalendarLeaveList } from "../api/leaveFormApi";
import { getCalendarDayList } from "../api/calendarApi";
import { today } from "../utils/today";
import Calendar from "../components/Calendar";
import LeaveDetail from "../components/LeaveDetail";

/** 請假行事曆（F-06） */
function CalendarPage() {
  const [todayYear, todayMonth] = today().split("-").map(Number);
  const [loading, setLoading] = useState(true);
  const [leaveList, setLeaveList] = useState<LeaveFormResponse[]>([]);
  const [calendarDayList, setCalendarDayList] = useState<CalendarDay[]>([]);
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

  // 首次進入，抓行事曆上的假單和辦公日曆
  useEffect(() => {
    async function loadData() {
      const [leaves, calendarDays] = await Promise.all([
        getCalendarLeaveList(),
        getCalendarDayList(),
      ]);
      setLeaveList(leaves);
      setCalendarDayList(calendarDays);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <>
      <h1>請假行事曆</h1>

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

      {selectedLeave && (
        <LeaveDetail
          leaveFormResponse={selectedLeave}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

export default CalendarPage;
