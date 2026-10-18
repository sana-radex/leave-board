import type { Department, Employee } from "../types/types";
import { roleLabels } from "../utils/label";
import "./Header.css";

interface HeaderProps {
  /** 目前使用者 id */
  currentUserId: string;
  /** 所有員工 */
  employeeList: Employee[];
  /** 所有部門 */
  departmentList: Department[];
  /** 切換使用者時要做的事 */
  onSwitchUser: (userId: string) => void;
}

/** 頁首 */
function Header({
  currentUserId,
  employeeList,
  departmentList,
  onSwitchUser,
}: HeaderProps) {
  /** 取得部門名稱 */
  function getDepartmentName(deptId: string): string {
    const department = departmentList.find((dept) => dept.id === deptId);
    return department ? department.name : "未知";
  }

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
              {`${emp.name}(${getDepartmentName(emp.departmentId)}・${roleLabels[emp.role]})`}
            </option>
          ))}
        </select>
      </label>
    </header>
  );
}

export default Header;
