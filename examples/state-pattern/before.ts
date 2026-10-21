
// 先定義有哪些狀態
type LeaveStatus = "pending" | "approved" | "rejected";

class LeaveForm {
  // 假單目前的狀態
  private status: LeaveStatus = "pending";

  // 每個動作 都是一個方法 並用if/else判斷狀態
  approve() {
    if (this.status === "pending") {
      this.status = "approved";
      console.log("已核准");
    } else if (this.status === "approved") {
      console.log("已經核准過了");
    } else if (this.status === "rejected") {
      console.log("已退回，不能核准");
    }
  }

  reject() {
    if (this.status === "pending") {
      this.status = "rejected";
      console.log("已退回");
    } else if (this.status === "approved") {
      console.log("已核准，不能退回");
    } else if (this.status === "rejected") {
      console.log("已經退回過了");
    }
  }

  getStatusName() {
    if (this.status === "pending") {
      return "待審核";
    } else if (this.status === "approved") {
      return "已核准";
    } else {
      return "已退回";
    }
  }
}

console.log("使用狀態模式前");
console.log("【假單 A】");
const formA = new LeaveForm();
console.log(`目前狀態：${formA.getStatusName()}`);
console.log("> 主管核准");
formA.approve();
console.log("> 主管核准");
formA.approve();
console.log("> 主管退回");
formA.reject();

console.log("【假單 B】");
const formB = new LeaveForm();
console.log(`目前狀態：${formB.getStatusName()}`);
console.log("> 主管退回");
formB.reject();
console.log("> 主管核准");
formB.approve();

// 使用狀態模式前
// 【假單 A】
// 目前狀態：待審核
// > 主管核准
// 已核准
// > 主管核准
// 已經核准過了
// > 主管退回
// 已核准，不能退回
// 【假單 B】
// 目前狀態：待審核
// > 主管退回
// 已退回
// > 主管核准
// 已退回，不能核准

export {};
