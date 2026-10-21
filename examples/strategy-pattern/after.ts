// 先定義策略的介面
interface QuotaStrategy {
  getAvailable(usedDays: number): number;
}

// 實作 曆年制 的算法
class YearlyQuota implements QuotaStrategy {
  getAvailable(usedDays: number) {
    return 14 - usedDays;
  }
}

// 實作 單次事件 的算法
class PerEventQuota implements QuotaStrategy {
  getAvailable() {
    return 8;
  }
}

// 實作 批次型 的算法
class BatchQuota implements QuotaStrategy {
  getAvailable(usedDays: number) {
    // 去年剩3天已過期不能用，只算今年給的7天
    return 7 - usedDays;
  }
}

// 假別
class LeaveType {
  name: string;
  // 改記策略物件
  private strategy: QuotaStrategy;

  constructor(name: string, strategy: QuotaStrategy) {
    this.name = name;
    this.strategy = strategy;
  }

  check(days: number, usedDays: number) {
    const available = this.strategy.getAvailable(usedDays);
    if (days <= available) {
      console.log(`可以請（最多可以請${available}天）`);
    } else {
      console.log(`不行，最多只能請${available}天`);
    }
  }
}

// 輸出
console.log("使用策略模式後");
const personal = new LeaveType("事假", new YearlyQuota());
console.log(`【${personal.name}】`);
console.log("> 之前請過10天，這次請3天");
personal.check(3, 10);
console.log("> 之前請過10天，這次請5天");
personal.check(5, 10);
const marriage = new LeaveType("婚假", new PerEventQuota());
console.log(`【${marriage.name}】`);
console.log("> 之前請過8天，這次請8天");
marriage.check(8, 8);
const annual = new LeaveType("特休", new BatchQuota());
console.log(`【${annual.name}】`);
console.log("> 之前請過2天，這次請6天");
annual.check(6, 2);

export {};
