interface LeaveState {
  revoke(): void;
}

class PendingState implements LeaveState {
  private form: LeaveForm;

  constructor(form: LeaveForm) {
    this.form = form;
  }

  // ...
  revoke() {
    this.form.setState(new RevokedState());
    console.log("已撤銷");
  }
}

class ApprovedState implements LeaveState {
  // ...
  revoke() {
    console.log("已核准，不能撤銷");
  }
}

class RejectedState implements LeaveState {
  // ...
  revoke() {
    console.log("已退回，不能撤銷");
  }
}

// 加入 已撤銷 的狀態行為
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

// 輸出
console.log("【假單 C】");
const formC = new LeaveForm();
console.log(`目前狀態：${formC.getStatusName()}`);
console.log("> 申請人點擊撤銷按鈕");
formC.revoke();
console.log("> 主管點擊核准按鈕");
formC.approve();
console.log("> 申請人點擊撤銷按鈕");
formC.revoke();
