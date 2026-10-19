import "./Calendar.css";
import type {
  CalendarDay,
  LeaveDayResponse,
  LeaveFormResponse,
} from "../types/types";
import { formatTime, toDateKey } from "../utils/format";

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
  leaves: LeaveFormResponse[];
  /** 辦公日曆（國定假日、補班日） */
  calendarDays: CalendarDay[];
  /** 點了某張假單時要做的事 */
  onSelectLeave: (leaveId: string) => void;
}

/** 月曆：把假單和國定假日畫在格子上 */
function Calendar({
  year,
  month,
  leaves,
  calendarDays,
  onSelectLeave,
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

  /** 找出這天有請假的假單：每日明細裡有這一天的（非工作天不會有） */
  function getLeavesOfDay(dateKey: string) {
    const result: { leave: LeaveFormResponse; day: LeaveDayResponse }[] = [];
    for (const leave of leaves) {
      const day = leave.days.find((item) => item.date === dateKey);
      if (day) {
        result.push({ leave, day });
      }
    }
    return result;
  }

  /** 標籤文字：姓名 假別，非整天加時段，已撤銷加註 */
  function getLeaveLabel(leave: LeaveFormResponse, day: LeaveDayResponse) {
    let label = `${leave.employeeName} ${leave.leaveTypeName}`;
    if (!day.isFullDay) {
      label += ` ${formatTime(day.startTime)}–${formatTime(day.endTime)}`;
    }
    if (leave.status === "revoked") {
      label += "（已撤銷）";
    }
    return label;
  }

  /** 標籤顏色 */
  function getLeaveClassName(leave: LeaveFormResponse) {
    if (leave.status === "revoked") {
      return "tag tag-revoked";
    }
    if (leave.isMine) {
      return "tag tag-mine";
    }
    return "tag tag-approved";
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

          // 週六、週日加底色；補班日要上班，不加
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isMakeupWorkday = specialDay?.type === "makeup_workday";

          let className = "calendar-cell";
          if (date.getMonth() !== month) {
            className += " other-month";
          }
          if (isWeekend && !isMakeupWorkday) {
            className += " weekend";
          }

          return (
            <div key={index} className={className}>
              <div>{date.getDate()}</div>
              {specialDay && (
                <span className={`tag tag-${specialDay.type}`}>
                  {specialDay.name}
                </span>
              )}
              {dayLeaves.map(({ leave, day }) => (
                <button
                  key={leave.id}
                  className={getLeaveClassName(leave)}
                  onClick={() => onSelectLeave(leave.id)}
                >
                  {getLeaveLabel(leave, day)}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Calendar;
