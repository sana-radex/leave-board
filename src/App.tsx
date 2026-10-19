import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router";
import "./App.css";
import type { Employee, UserOptionResponse } from "./types/types";
import {
  getCurrentUserInfo,
  getUserOptionList,
  switchUser,
} from "./api/currentUserApi";
import { getInboxCount } from "./api/leaveFormApi";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import CalendarPage from "./pages/CalendarPage";
import MyLeavesPage from "./pages/MyLeavesPage";
import NewLeavePage from "./pages/NewLeavePage";
import InboxPage from "./pages/InboxPage";

function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [userOptions, setUserOptions] = useState<UserOptionResponse[]>([]);
  // 導覽列「待我處理（N）」的數量
  const [inboxCount, setInboxCount] = useState(0);

  // 首次進入，抓目前使用者、可以切換的使用者、待我處理數量
  useEffect(() => {
    async function firstLoad() {
      const [user, options, count] = await Promise.all([
        getCurrentUserInfo(),
        getUserOptionList(),
        getInboxCount(),
      ]);
      setCurrentUser(user);
      setUserOptions(options);
      setInboxCount(count);
    }
    firstLoad();
  }, []);

  /** 切換目前使用者，待我處理數量也換成新使用者的 */
  async function handleSwitchUser(employeeId: string) {
    const user = await switchUser(employeeId);
    setCurrentUser(user);
    setInboxCount(await getInboxCount());
  }

  /** 重新抓待我處理數量（審核、撤銷之後） */
  async function refreshInboxCount() {
    setInboxCount(await getInboxCount());
  }

  if (!currentUser) {
    return <p>載入中...</p>;
  }

  const isReviewer = currentUser.role === "reviewer";

  return (
    <>
      <Header
        currentUser={currentUser}
        userOptions={userOptions}
        onSwitchUser={handleSwitchUser}
      />

      <div className="layout">
        <Sidebar isReviewer={isReviewer} inboxCount={inboxCount} />

        {/* key 用目前使用者 id：切換使用者時，頁面整個重新載入，資料改成新使用者的 */}
        <main className="content" key={currentUser.id}>
          <Routes>
            <Route
              path="/"
              element={<CalendarPage onLeaveChanged={refreshInboxCount} />}
            />
            <Route path="/leave/new" element={<NewLeavePage />} />
            <Route path="/my-leaves" element={<MyLeavesPage />} />
            {/* 待我處理只有審核人能進；切換成提交人時會導回行事曆 */}
            <Route
              path="/inbox"
              element={
                isReviewer ? (
                  <InboxPage onLeaveChanged={refreshInboxCount} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* 其他網址（例如以前的 /login）都導回行事曆 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;
