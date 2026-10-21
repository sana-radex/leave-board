
// 額度類型：曆年制、單次事件、批次型
type QuotaType = "yearly" | "per_event" | "batch";

class LeaveType {
  name: string;
  private quotaType: QuotaType;

  constructor(name: string, quotaType: QuotaType) {
    this.name = name;
    this.quotaType = quotaType;
  }

  // 檢查額度方法
  check(days: number, usedDays: number) {
    let available = 0;

    if (this.quotaType === "yearly") {
      // 曆年制：每年14天，扣掉之前請過的
      available = 14 - usedDays;
    } else if (this.quotaType === "per_event") {
      // 單次事件：每次8天，不看之前請過幾次
      available = 8;
    } else if (this.quotaType === "batch") {
      // 批次型：只算今年給的7天，過期的不算
      available = 7 - usedDays;
    }

    if (days <= available) {
      console.log(`可以請（最多可以請${available}天）`);
    } else {
      console.log(`不行，最多只能請${available}天`);
    }
  }
}

// 輸出

const personal = new LeaveType("事假", "yearly");
console.log(`【${personal.name}】`);
console.log("> 之前請過10天，這次請3天");
personal.check(3, 10);
console.log("> 之前請過10天，這次請5天");
personal.check(5, 10);

const marriage = new LeaveType("婚假", "per_event");
console.log(`【${marriage.name}】`);
console.log("> 之前請過8天，這次請8天");
marriage.check(8, 8);

const annual = new LeaveType("特休", "batch");
console.log(`【${annual.name}】`);
console.log("> 之前請過2天，這次請6天");
annual.check(6, 2);

export {};
