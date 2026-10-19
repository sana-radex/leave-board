import { NavLink } from "react-router";
import "./Sidebar.css";

interface SidebarProps {
  /** 目前使用者是不是審核人：審核人才有「待我處理」 */
  isReviewer: boolean;
  /** 待我處理的數量 */
  inboxCount: number;
}

/** 左側選單（導覽列） */
function Sidebar({ isReviewer, inboxCount }: SidebarProps) {
  return (
    <nav className="sidebar">
      <NavLink to="/" end>
        請假行事曆
      </NavLink>
      <NavLink to="/leave/new">新增請假</NavLink>
      <NavLink to="/my-leaves">我的假單</NavLink>
      <NavLink to="/my-quota">我的額度</NavLink>
      {isReviewer && <NavLink to="/inbox">待我處理（{inboxCount}）</NavLink>}
    </nav>
  );
}

export default Sidebar;
