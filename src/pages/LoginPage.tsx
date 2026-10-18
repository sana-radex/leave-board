import { useState } from "react";
import "./LoginPage.css";
import type { Role } from "../types/types";
import { roleLabels } from "../utils/label";

interface LoginPageProps {
  onLogin: (role: Role) => Promise<void>;
}

/** 登入頁：選一個角色登入 */
function LoginPage({ onLogin }: LoginPageProps) {
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleClick(role: Role) {
    setLoggingIn(true);
    await onLogin(role);
    setLoggingIn(false);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>請假系統</h1>
        <p>請選擇要用哪個角色登入</p>

        <div className="login-roles">
          {Object.entries(roleLabels).map(([role, label]) => (
            <button
              key={role}
              onClick={() => handleClick(role as Role)}
              disabled={loggingIn}
            >
              {label}
            </button>
          ))}
        </div>

        {loggingIn && <p>登入中...</p>}
      </div>
    </div>
  );
}

export default LoginPage;
