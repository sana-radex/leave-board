import "./Calendar.css";
import type {
  CalendarDay,
  CalendarFilter,
  LeaveDayResponse,
  LeaveFormResponse,
} from "../types/types";
import { formatTime, toDateKey } from "../utils/format";
import { today } from "../utils/today";

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
  /** 篩選條件：哪幾類要顯示 */
  filter: CalendarFilter;
  /** 點了某張假單時要做的事 */
  onSelectLeave: (leaveId: string) => void;
}

/** 月曆：把假單和國定假日畫在格子上 */
function Calendar({
  year,
  month,
  leaves,
  calendarDays,
  filter,
  onSelectLeave,
}: CalendarProps) {
  // 這個月 1 號是星期幾（0 = 星期一，6 = 星期日）
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayKey = today();

  const cells = Array.from(
    { length: CELL_COUNT },
    (_, index) => new Date(year, month, 1 - firstWeekday + index),
  );

  /** 找出這天的國定假日或補班日（沒有就是 undefined） */
  function getSpecialDay(dateKey: string) {
    return calendarDays.find((day) => day.date === dateKey);
  }

  /** 這張假單有沒有被篩掉：已撤銷看「已撤銷」，其他看是不是自己的 */
  function isLeaveShown(leave: LeaveFormResponse) {
    if (leave.status === "revoked") {
      return filter.revoked;
    }
    if (leave.isMine) {
      return filter.mine;
    }
    return filter.others;
  }

  /** 找出這天有請假、而且沒被篩掉的假單：每日明細裡有這一天的（非工作天不會有） */
  function getLeavesOfDay(dateKey: string) {
    const result: { leave: LeaveFormResponse; day: LeaveDayResponse }[] = [];
    for (const leave of leaves) {
      if (!isLeaveShown(leave)) {
        continue;
      }
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
          const dateKey = toDateKey(date);
          const specialDay = getSpecialDay(dateKey);
          const dayLeaves = getLeavesOfDay(dateKey);
          // 國定假日、補班日的標示有沒有被篩掉（底色照常，因為放不放假不會變）
          const showSpecialDay = specialDay && filter[specialDay.type];

          // 不用上班的日子加底色
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isMakeupWorkday = specialDay?.type === "makeup_workday";
          const isHoliday = specialDay?.type === "holiday";

          let className = "calendar-cell";
          if ((isWeekend && !isMakeupWorkday) || isHoliday) {
            className += " off-day";
          }
          if (isHoliday && showSpecialDay) {
            className += " holiday";
          }
          if (dateKey === todayKey) {
            className += " today";
          }

          return (
            <div key={index} className={className}>
              <div className="calendar-date">{date.getDate()}</div>
              {showSpecialDay && (
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
