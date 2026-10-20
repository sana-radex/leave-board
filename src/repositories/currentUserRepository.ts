const CURRENT_USER_KEY = "currentUserId";

/** 讀出目前使用者 id；沒選過就回傳 null */
export function loadCurrentUserId(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

/** 存入目前使用者 id */
export function saveCurrentUserId(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}
