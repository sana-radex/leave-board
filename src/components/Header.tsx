import type { Employee } from "../types/domain";
import type { UserOptionResponse } from "../types/api";
import { ROLE_LABELS } from "../utils/label";
import "./Header.css";

interface HeaderProps {
  /** 目前使用者 */
  currentUser: Employee;
  /** 可以切換的使用者 */
  userOptions: UserOptionResponse[];
  /** 選了另一位使用者時要做的事 */
  onSwitchUser: (employeeId: string) => void;
}

/** 頁首：切換目前使用者，模擬不同角色 */
function Header({ currentUser, userOptions, onSwitchUser }: HeaderProps) {
  return (
    <header className="header">
      <span className="header-title">請假系統</span>

      <div className="header-user">
        <label>
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
          >
            {userOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {`${option.name}｜${ROLE_LABELS[option.role]}｜${option.shiftName}`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}

export default Header;
