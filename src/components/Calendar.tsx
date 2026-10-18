import "./Calendar.css";
import type { CalendarDay, LeaveForm } from "../types/types";
import { statusLabels } from "../utils/label";
import { toDateKey } from "../utils/format";

/** 格子數：一個月最多跨 6 週，每週 7 天 */
const CELL_COUNT = 6 * 7;

/** 星期標題（從星期一開始） */
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

interface CalendarProps {
  /** 要顯示哪一年 */
  year: number;
  /** 要顯示哪個月（0 = 1 月，11 = 12 月） */
  month: number;
  /** 要顯示的假單 */
  leaves: LeaveForm[];
  /** 辦公日曆（國定假日、補班日） */
  calendarDays: CalendarDay[];
  /** 用員工 id 查姓名 */
  getEmployeeName: (empId: string) => string;
}

/** 月曆：把假單和國定假日畫在格子上 */
function Calendar({
  year,
  month,
  leaves,
  calendarDays,
  getEmployeeName,
}: CalendarProps) {
  // 這個月 1 號是星期幾（0 = 星期一，6 = 星期日）
  // getDay() 是 0 = 星期日，加 6 再取 7 的餘數，就變成從星期一開始算
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  // 第 1 格 = 1 號往前推 firstWeekday 天，之後每格加 1 天
  const cells = Array.from(
    { length: CELL_COUNT },
    (_, index) => new Date(year, month, 1 - firstWeekday + index),
  );

  /** 找出這天的國定假日或補班日（沒有就是 undefined） */
  function getSpecialDay(dateKey: string) {
    return calendarDays.find((day) => day.date === dateKey);
  }

  /** 找出這天有請假的假單：開始日期 <= 這天 <= 結束日期 */
  function getLeavesOfDay(dateKey: string) {
    return leaves.filter(
      (leave) =>
        leave.startTime.slice(0, 10) <= dateKey &&
        dateKey <= leave.endTime.slice(0, 10),
    );
  }

  /** 標籤文字：已核准只寫姓名，其他狀態在後面註明 */
  function getLeaveLabel(leave: LeaveForm): string {
    const name = getEmployeeName(leave.employeeId);
    if (leave.status === "approved") return name;
    return `${name}（${statusLabels[leave.status]}）`;
  }

  return (
    <section className="calendar">
      <div className="calendar-grid">
        {WEEKDAYS.map((name) => (
          <div key={name} className="calendar-weekday">
            {name}
          </div>
        ))}
        {cells.map((date, index) => {
          // 每一格要先算出：日期字串、國定假日、當天的假單
          const dateKey = toDateKey(date);
          const specialDay = getSpecialDay(dateKey);
          const dayLeaves = getLeavesOfDay(dateKey);

          return (
            <div
              key={index}
              className={
                date.getMonth() === month
                  ? "calendar-cell"
                  : "calendar-cell other-month"
              }
            >
              <div>{date.getDate()}</div>
              {specialDay && (
                <span className={`tag tag-${specialDay.type}`}>
                  {specialDay.name}
                </span>
              )}
              {dayLeaves.map((leave) => (
                <span key={leave.id} className={`tag tag-${leave.status}`}>
                  {getLeaveLabel(leave)}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Calendar;
