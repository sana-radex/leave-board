import type { Employee, UserOptionResponse } from "../types/types";
import { roleLabels } from "../utils/label";
import { resetData } from "../api/db";
import "./Header.css";

interface HeaderProps {
  /** 目前使用者 */
  currentUser: Employee;
  /** 可以切換的使用者 */
  userOptions: UserOptionResponse[];
  /** 選了另一位使用者時要做的事 */
  onSwitchUser: (employeeId: string) => void;
}

/** 頁首：切換目前使用者，模擬不同角色（F-01） */
function Header({ currentUser, userOptions, onSwitchUser }: HeaderProps) {
  return (
    <header className="header">
      <span className="header-title">請假系統</span>

      <div className="header-user">
        <label>
          目前使用者
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
          >
            {userOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {`${option.name}｜${roleLabels[option.role]}｜${option.shiftName}`}
              </option>
            ))}
          </select>
        </label>

        {import.meta.env.DEV && <button onClick={resetData}>重置資料</button>}
      </div>
    </header>
  );
}

export default Header;
