import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router";
import "./App.css";
import type { Employee, LeaveType, Role } from "./types/types";
import { getEmployeeList } from "./api/employeeApi";
import { getLeaveTypeList } from "./api/leaveTypeApi";
import { login, logout } from "./api/authApi";
import { loadAuth, saveAuth, clearAuth } from "./storage/authStorage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CalendarPage from "./pages/CalendarPage";
import MyLeavesPage from "./pages/MyLeavesPage";
import LoginPage from "./pages/LoginPage";

function App() {
  const [auth, setAuth] = useState(() => loadAuth());
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

  /** 登入 */
  async function handleLogin(role: Role) {
    const session = await login(role);
    if (!session) {
      alert("找不到這個角色的帳號");
      return;
    }
    saveAuth(session); // 存進 localStorage：重新整理還在
    setAuth(session); // 存進 state：畫面才會更新
  }

  /** 登出：先請後端作廢 token，再清掉前端自己存的 */
  async function handleLogout() {
    if (auth) {
      await logout(auth.token);
    }
    clearAuth();
    setAuth(null);
  }

  // 還沒登入：只有 /login 這一頁，其他網址都導去 /login
  // 所以按下登出、auth 變成 null 之後，會從這裡被導回登入頁
  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const currentUser = auth.user;

  return (
    <>
      <Header currentUser={currentUser} onLogout={handleLogout} />

      <div className="layout">
        <Sidebar />

        <main className="content">
          <Routes>
            <Route
              path="/"
              element={
                <CalendarPage
                  currentUserId={currentUser.id}
                  employeeList={employeeList}
                />
              }
            />
            <Route
              path="/my-leaves"
              element={
                <MyLeavesPage
                  currentUserId={currentUser.id}
                  employeeList={employeeList}
                  leaveTypeList={leaveTypeList}
                />
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
