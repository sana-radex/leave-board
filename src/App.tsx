import { useEffect, useState } from "react";
import { Routes, Route } from "react-router";
import "./App.css";
import type { Employee, LeaveType } from "./types/types";
import { getEmployeeList } from "./api/employeeApi";
import { getLeaveTypeList } from "./api/leaveTypeApi";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CalendarPage from "./pages/CalendarPage";
import MyLeavesPage from "./pages/MyLeavesPage";

function App() {
  const [currentUserId, setCurrentUserId] = useState("1");
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [leaveTypeList, setLeaveTypeList] = useState<LeaveType[]>([]);


  useEffect(() => {
    async function firstLoad() {
      const [employees, leaveTypes] = await Promise.all([
        getEmployeeList(),
        getLeaveTypeList(),
      ]);
      setEmployeeList(employees);
      setLeaveTypeList(leaveTypes);
    }
    firstLoad();
  }, []);

  return (
    <>
      <Header
        currentUserId={currentUserId}
        employeeList={employeeList}
        onSwitchUser={setCurrentUserId}
      />

      <div className="layout">
        <Sidebar />

        <main className="content">
          <Routes>
            <Route
              path="/"
              element={
                <CalendarPage
                  currentUserId={currentUserId}
                  employeeList={employeeList}
                />
              }
            />
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
