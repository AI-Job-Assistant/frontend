/* ============================================================
   인증 헬퍼 — Firebase 대신 MySQL 백엔드 API 사용
   ============================================================ */

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* 로그인 — 학번 + 비번 → JWT 토큰 발급 */
export async function signIn({ studentId, password }) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, password }),
  });

  const data = await res.json();

  if (!data.success) {
    const err = new Error(data.error || "로그인 실패");
    err.code = res.status;
    throw err;
  }

  // 토큰 및 유저 정보 저장 (userId 포함)
  localStorage.setItem("token", data.data.token);
  localStorage.setItem("userId", data.data.user.id);
  localStorage.setItem("studentId", data.data.user.studentId);
  localStorage.setItem("userName", data.data.user.name || "");

  return data.data.user;
}

/* 로그아웃 — 저장된 토큰 및 유저 정보 삭제 */
export async function logOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("studentId");
  localStorage.removeItem("userName");
}

/* 토큰 가져오기 (api.js에서 인증 헤더에 쓸 때) */
export function getToken() {
  return localStorage.getItem("token");
}

/* 저장된 로그인 정보 복원 (새로고침 시) — 중복 없이 하나만 존재해야 함! */
export function getStoredUser() {
  const token = localStorage.getItem("token");
  const studentId = localStorage.getItem("studentId");
  if (!token || !studentId) return null;
  return { 
    token, 
    userId: localStorage.getItem("userId"), 
    studentId, 
    name: localStorage.getItem("userName") || "" 
  };
}

/* 에러 메시지 */
export function authErrorMessage(message) {
  if (!message) return "문제가 발생했어요. 다시 시도해주세요.";
  if (message === "Failed to fetch") return "네트워크 연결을 확인해주세요.";
  return message;
}

/* 회원가입 */
export async function signUp({ studentId, password, name, email, departmentId }) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, password, name, email, departmentId }),
  });
  const data = await res.json();
  if (!data.success) {
    const err = new Error(data.error || "회원가입 실패");
    throw err;
  }
  return data.data;
}