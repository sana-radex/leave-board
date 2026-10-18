import "./Calendar.css";

/** 格子數：一個月最多跨 6 週，每週 7 天 */
const CELL_COUNT = 6 * 7;

/** 星期標題（從星期一開始） */
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

/** 團隊行事曆 */
function Calendar() {
  // 先固定顯示這個月
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = 1 月，11 = 12 月

  // 這個月 1 號是星期幾（0 = 星期一，6 = 星期日）
  // getDay() 是 0 = 星期日，加 6 再取 7 的餘數，就變成從星期一開始算
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  // 第 1 格 = 1 號往前推 firstWeekday 天，之後每格加 1 天
  const cells = Array.from(
    { length: CELL_COUNT },
    (_, index) => new Date(year, month, 1 - firstWeekday + index),

  );

  return (
    <section className="calendar">
      <h2>團隊行事曆</h2>
      <p className="calendar-month">
        {year} 年 {month + 1} 月
      </p>
      <div className="calendar-grid">
        {WEEKDAYS.map((name) => (
          <div key={name} className="calendar-weekday">
            {name}
          </div>
        ))}
        {cells.map((date, index) => (
          <div
            key={index}
            className={
              date.getMonth() === month
                ? "calendar-cell"
                : "calendar-cell other-month"
            }
          >
            {date.getDate()}
          </div>
        ))}
      </div>
    </section>
  );
}

export default Calendar;
