import type { Employee } from "../types/types";
import { roleLabels } from "../utils/label";
import "./Header.css";

interface HeaderProps {
  /** 目前登入的使用者 */
  currentUser: Employee;
  /** 按下登出時要做的事 */
  onLogout: () => void;
}

/** 頁首 */
function Header({ currentUser, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <span className="header-title">請假系統</span>

      <div className="header-user">
        <span>{`${currentUser.name}(${roleLabels[currentUser.role]})`}</span>
        <button onClick={onLogout}>登出</button>
      </div>
    </header>
  );
}

export default Header;
