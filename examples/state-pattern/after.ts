// 先定義狀態的介面
interface LeaveState {
  name: string;
  approve(): void;
  reject(): void;
  // 新增撤銷動作
  revoke(): void;
}

// 實作 待審核 的狀態行為
class PendingState implements LeaveState {
  name = "待審核";
  private form: LeaveForm;

  constructor(form: LeaveForm) {
    this.form = form;
  }

  approve() {
    this.form.setState(new ApprovedState());
    console.log("已核准");
  }

  reject() {
    this.form.setState(new RejectedState());
    console.log("已退回");
  }

  revoke() {
    this.form.setState(new RevokedState());
    console.log("已撤銷");
  }
}

// 實作 已核准 的狀態行為
class ApprovedState implements LeaveState {
  name = "已核准";

  approve() {
    console.log("已經核准過了");
  }

  reject() {
    console.log("已核准，不能退回");
  }

  revoke() {
    console.log("已核准，不能撤銷");
  }
}

// 實作 已退回 的狀態行為
class RejectedState implements LeaveState {
  name = "已退回";

  approve() {
    console.log("已退回，不能核准");
  }

  reject() {
    console.log("已經退回過了");
  }

  revoke() {
    console.log("已退回，不能撤銷");
  }
}

// 實作 已撤銷 的狀態行為
class RevokedState implements LeaveState {
  name = "已撤銷";

  approve() {
    console.log("已撤銷，不能核准");
  }

  reject() {
    console.log("已撤銷，不能退回");
  }

  revoke() {
    console.log("已經撤銷過了");
  }
}

// 假單
class LeaveForm {
  // 改記狀態物件
  private state: LeaveState = new PendingState(this);

  setState(state: LeaveState) {
    this.state = state;
  }

  approve() {
    this.state.approve();
  }

  reject() {
    this.state.reject();
  }

  revoke() {
    this.state.revoke();
  }

  getStatusName() {
    return this.state.name;
  }
}

console.log("使用狀態模式後");

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

// 輸出
console.log("【假單 C】");
const formC = new LeaveForm();
console.log(`目前狀態：${formC.getStatusName()}`);
console.log("> 申請人撤銷");
formC.revoke();
console.log("> 主管核准");
formC.approve();
console.log("> 申請人撤銷");
formC.revoke();

// 使用狀態模式後
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
// 【假單 C】
// 目前狀態：待審核
// > 申請人撤銷
// 已撤銷
// > 主管核准
// 已撤銷，不能核准
// > 申請人撤銷
// 已經撤銷過了

export {};

