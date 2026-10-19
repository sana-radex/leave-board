import type { Batch, Employee, FlexLeaveDate } from "../types/types";
import { addDays, addMonths, isLeapYear } from "./date";
import { formatDate } from "../utils/format";

/**
 * 特休天數：到職滿幾年（LEAVE 年資表，依勞基法第 38 條）
 * 滿 6 個月另外算（3 天），這裡只處理滿 1 年以上
 */
export function getAnnualDays(years: number): number {
  if (years === 1) return 7;
  if (years === 2) return 10;
  if (years < 5) return 14;
  if (years < 10) return 15;
  // 滿 10 年 16 日，之後每滿 1 年加 1 日，上限 30 日
  return Math.min(30, 16 + (years - 10));
}

/**
 * 特休批次（LEAVE-01～03）
 * 到職滿 6 個月第一筆（3 天），之後每滿 1 年一筆；有效到下一筆生效日的前一天
 */
function generateAnnualBatches(
  employee: Employee,
  lastEffectiveDate: string,
): Batch[] {
  // 先列出每一筆的生效日和天數，多列一筆，用來算最後一筆的到期日
  const starts = [{ date: addMonths(employee.hireDate, 6), days: 3 }];
  for (let years = 1; ; years++) {
    const date = addMonths(employee.hireDate, 12 * years);
    starts.push({ date, days: getAnnualDays(years) });
    if (date > lastEffectiveDate) {
      break;
    }
  }

  const batches: Batch[] = [];
  for (let i = 0; i < starts.length - 1; i++) {
    const { date, days } = starts[i];
    if (date > lastEffectiveDate) {
      break;
    }
    batches.push({
      id: `annual:${employee.id}:${date}`,
      leaveTypeId: "annual",
      name: `特休（${formatDate(date)}）`,
      effectiveDate: date,
      expiryDate: addDays(starts[i + 1].date, -1),
      hours: days * 8,
    });
  }
  return batches;
}

/**
 * 彈性假批次（LEAVE-04、06）
 * 每個公布日一筆 1 天，公布日起可請、隔年 2/28 到期；只給到職日當天及之後公布的
 */
function generateFlexBatches(
  employee: Employee,
  flexDates: FlexLeaveDate[],
  lastEffectiveDate: string,
): Batch[] {
  return flexDates
    .filter(
      (flex) =>
        flex.date >= employee.hireDate && flex.date <= lastEffectiveDate,
    )
    .map((flex) => {
      const nextYear = Number(flex.date.slice(0, 4)) + 1;
      return {
        id: `flex:${employee.id}:${flex.date}`,
        leaveTypeId: "flex",
        name: `彈性假（${formatDate(flex.date)}）`,
        effectiveDate: flex.date,
        expiryDate: `${nextYear}-02-28`,
        hours: 8,
      };
    });
}

/**
 * 生日假批次（LEAVE-09～12）
 * 每年 1 天，生日往前 1 個月～往後 1 個月；對應日期不存在取月底；
 * 2/29 生日在非閏年視為 2/28；跨年時歸屬生日所在年度
 */
function generateBirthdayBatches(
  employee: Employee,
  lastEffectiveDate: string,
): Batch[] {
  const [, month, day] = employee.birthday.split("-");
  const hireYear = Number(employee.hireDate.slice(0, 4));
  const lastYear = Number(lastEffectiveDate.slice(0, 4)) + 1; // 明年的生日假可能今年就生效

  const batches: Batch[] = [];
  for (let year = hireYear; year <= lastYear; year++) {
    let birthday = `${year}-${month}-${day}`;
    if (month === "02" && day === "29" && !isLeapYear(year)) {
      birthday = `${year}-02-28`;
    }
    const effectiveDate = addMonths(birthday, -1);
    const expiryDate = addMonths(birthday, 1);

    // 還沒到產生範圍、或到職前就過期的，不產生
    if (effectiveDate > lastEffectiveDate || expiryDate < employee.hireDate) {
      continue;
    }
    batches.push({
      id: `birthday:${employee.id}:${year}`,
      leaveTypeId: "birthday",
      name: `生日假（${year}）`,
      effectiveDate,
      expiryDate,
      hours: 8,
    });
  }
  return batches;
}

/**
 * 產生某位人員的所有批次（特休、彈性假、生日假）
 * 從到職起，產生到「生效日在今年 12/31 以前」的批次為止（待確認 Q1）
 */
export function generateBatches(
  employee: Employee,
  flexDates: FlexLeaveDate[],
  today: string,
): Batch[] {
  const lastEffectiveDate = `${today.slice(0, 4)}-12-31`;
  return [
    ...generateAnnualBatches(employee, lastEffectiveDate),
    ...generateFlexBatches(employee, flexDates, lastEffectiveDate),
    ...generateBirthdayBatches(employee, lastEffectiveDate),
  ];
}
