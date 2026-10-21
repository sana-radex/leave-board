
// 假單狀態：待審核、已核准、已退回
type LeaveStatus = "pending" | "approved" | "rejected";

// 假單類別
class LeaveForm {
  private status: LeaveStatus = "pending";

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

console.log("【假單 A】");
const formA = new LeaveForm();
console.log(`目前狀態：${formA.getStatusName()}`);
console.log("> 主管點擊核准按鈕");
formA.approve();
console.log("> 主管點擊核准按鈕");
formA.approve();
console.log("> 主管點擊退回按鈕");
formA.reject();

console.log("【假單 B】");
const formB = new LeaveForm();
console.log(`目前狀態：${formB.getStatusName()}`);
console.log("> 主管點擊退回按鈕");
formB.reject();
console.log("> 主管點擊核准按鈕");
formB.approve();

// 使用狀態模式前
// 【假單 A】
// 目前狀態：待審核
// > 主管點擊核准按鈕
// 已核准
// > 主管點擊核准按鈕
// 已經核准過了
// > 主管點擊退回按鈕
// 已核准，不能退回
// 【假單 B】
// 目前狀態：待審核
// > 主管點擊退回按鈕
// 已退回
// > 主管點擊核准按鈕
// 已退回，不能核准

export {};
