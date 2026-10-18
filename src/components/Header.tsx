import type { Employee } from "../types/types";
import { roleLabels } from "../utils/label";
import "./Header.css";

interface HeaderProps {
  /** 目前使用者 id */
  currentUserId: string;
  /** 所有員工 */
  employeeList: Employee[];
  /** 切換使用者時要做的事 */
  onSwitchUser: (userId: string) => void;
}

/** 頁首 */
function Header({
  currentUserId,
  employeeList,
  onSwitchUser,
}: HeaderProps) {

  return (
    <header className="header">
      <span className="header-title">請假系統</span>
      <label>
        <select
          value={currentUserId}
          onChange={(e) => onSwitchUser(e.target.value)}
        >
          {employeeList.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {`${emp.name}(${roleLabels[emp.role]})`}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

export default Header;
