import { useEffect, useState } from "react";
import { Routes, Route } from "react-router";
import "./App.css";
import type { Employee, LeaveType, Department } from "./types/types";
import { getEmployeeList } from "./api/employeeApi";
import { getLeaveTypeList } from "./api/leaveTypeApi";
import { getDepartmentList } from "./api/departmentApi";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Calendar from "./components/Calendar";
import MyLeavesPage from "./pages/MyLeavesPage";

function App() {
  const [currentUserId, setCurrentUserId] = useState("1");
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [leaveTypeList, setLeaveTypeList] = useState<LeaveType[]>([]);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);

  // 首次進入，抓員工、假別、部門
  useEffect(() => {
    async function firstLoad() {
      const [employees, leaveTypes, departments] = await Promise.all([
        getEmployeeList(),
        getLeaveTypeList(),
        getDepartmentList(),
      ]);
      setEmployeeList(employees);
      setLeaveTypeList(leaveTypes);
      setDepartmentList(departments);
    }
    firstLoad();
  }, []);

  return (
    <>
      <Header
        currentUserId={currentUserId}
        employeeList={employeeList}
        departmentList={departmentList}
        onSwitchUser={setCurrentUserId}
      />

      <div className="layout">
        <Sidebar />

        <main className="content">
          <Routes>
            <Route path="/" element={<Calendar />} />
            {/* key 換了，整頁會重新建立：列表、表單都回到初始狀態 */}
            <Route
              path="/my-leaves"
              element={
                <MyLeavesPage
                  key={currentUserId}
                  currentUserId={currentUserId}
                  employeeList={employeeList}
                  leaveTypeList={leaveTypeList}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
