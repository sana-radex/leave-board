import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router";
import "./App.css";
import type { Employee, UserOptionResponse } from "./types/types";
import {
  getCurrentUserInfo,
  getUserOptionList,
  switchUser,
} from "./api/currentUserApi";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CalendarPage from "./pages/CalendarPage";
import MyLeavesPage from "./pages/MyLeavesPage";
import NewLeavePage from "./pages/NewLeavePage";

function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [userOptions, setUserOptions] = useState<UserOptionResponse[]>([]);

  // 首次進入，抓目前使用者和可以切換的使用者
  useEffect(() => {
    async function firstLoad() {
      const [user, options] = await Promise.all([
        getCurrentUserInfo(),
        getUserOptionList(),
      ]);
      setCurrentUser(user);
      setUserOptions(options);
    }
    firstLoad();
  }, []);

  /** 切換目前使用者 */
  async function handleSwitchUser(employeeId: string) {
    const user = await switchUser(employeeId);
    setCurrentUser(user);
  }

  if (!currentUser) {
    return <p>載入中...</p>;
  }

  return (
    <>
      <Header
        currentUser={currentUser}
        userOptions={userOptions}
        onSwitchUser={handleSwitchUser}
      />

      <div className="layout">
        <Sidebar />

        {/* key 用目前使用者 id：切換使用者時，頁面整個重新載入，資料改成新使用者的 */}
        <main className="content" key={currentUser.id}>
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/leave/new" element={<NewLeavePage />} />
            <Route path="/my-leaves" element={<MyLeavesPage />} />
            {/* 其他網址（例如以前的 /login）都導回行事曆 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
