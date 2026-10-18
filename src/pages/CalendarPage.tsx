import { useEffect, useState } from "react";
import "./CalendarPage.css";
import type {
  CalendarDay,
  CalendarFilter,
  Employee,
  LeaveForm,
} from "../types/types";
import { getAllLeaveFormList } from "../api/leaveFormApi";
import { getCalendarDayList } from "../api/calendarApi";
import Calendar from "../components/Calendar";
import CalendarFilterModal from "../components/CalendarFilterModal";

interface CalendarPageProps {
  /** 目前使用者 id */
  currentUserId: string;
  /** 所有員工 */
  employeeList: Employee[];
}

/** 團隊行事曆 */
function CalendarPage({ currentUserId, employeeList }: CalendarPageProps) {
  const today = new Date();
  const [loading, setLoading] = useState(true);
  const [leaveList, setLeaveList] = useState<LeaveForm[]>([]);
  const [calendarDayList, setCalendarDayList] = useState<CalendarDay[]>([]);
  // 正在看的月份：存那個月的 1 號
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  // 篩選條件；預設照規格，待審核不顯示
  const [filter, setFilter] = useState<CalendarFilter>({
    pending: false,
    approved: true,
    revoked: true,
    holiday: true,
    makeup_workday: true,
  });
  const [showFilter, setShowFilter] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0 = 1 月，11 = 12 月

  // 目前使用者（員工資料還沒載入時是 undefined）
  const currentUser = employeeList.find((emp) => emp.id === currentUserId);

  // 有勾選的才顯示
  const visibleLeaves = leaveList.filter((leave) => filter[leave.status]);
  const visibleCalendarDays = calendarDayList.filter((day) => filter[day.type]);

  /** 取得員工名稱 */
  function getEmployeeName(empId: string): string {
    const employee = employeeList.find((emp) => emp.id === empId);
    return employee ? employee.name : "未知";
  }

  /** 換月份：-1 是上個月，+1 是下個月 */
  function changeMonth(offset: number) {
    // 月份超過 12 月或小於 1 月，Date 會自動換年
    setViewDate(new Date(year, month + offset, 1));
  }

  /** 篩選視窗按下完成：套用新的篩選條件，關閉視窗 */
  function handleFilterDone(newFilter: CalendarFilter) {
    setFilter(newFilter);
    setShowFilter(false);
  }

  // 首次進入，抓所有人的假單和辦公日曆
  useEffect(() => {
    async function loadData() {
      const [leaves, calendarDays] = await Promise.all([
        getAllLeaveFormList(),
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
      <h1>{currentUser ? `Hi, ${currentUser.name}` : "Hi"}</h1>

      <div className="calendar-toolbar">
        <button onClick={() => setShowFilter(true)}>篩選條件</button>
        <div className="month-switcher">
          <button onClick={() => changeMonth(-1)}>⬅</button>
          <span className="calendar-month">
            {year} / {month + 1} 
          </span>
          <button onClick={() => changeMonth(1)}>⮕</button>
        </div>
      </div>

      {loading && <p>載入中...</p>}

      <Calendar
        year={year}
        month={month}
        leaves={visibleLeaves}
        calendarDays={visibleCalendarDays}
        getEmployeeName={getEmployeeName}
      />

      {showFilter && (
        <CalendarFilterModal filter={filter} onDone={handleFilterDone} />
      )}
    </>
  );
}

export default CalendarPage;
