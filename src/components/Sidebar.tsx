import { NavLink } from "react-router";
import "./Sidebar.css";

/** 左側選單 */
function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/" end>
        團隊行事曆
      </NavLink>
      <NavLink to="/my-leaves">我的假單</NavLink>
    </nav>
  );
}

export default Sidebar;
