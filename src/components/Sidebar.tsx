import { NavLink } from "react-router";
import "./Sidebar.css";

/** 左側選單（導覽列） */
function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/" end>
        請假行事曆
      </NavLink>
      <NavLink to="/my-leaves">我的假單</NavLink>
    </nav>
  );
}

export default Sidebar;
