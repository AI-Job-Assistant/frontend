/*  ============================================================
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
    // 백엔드 에러 메시지를 그대로 던짐
    const err = new Error(data.error || "로그인 실패");
    err.code = res.status;
    throw err;
  }

  // 토큰 저장 (새로고침해도 로그인 유지)
  localStorage.setItem("token", data.data.token);
  localStorage.setItem("studentId", data.data.user.studentId);
  localStorage.setItem("userName", data.data.user.name || "");

  return data.data.user;
}

/* 로그아웃 — 저장된 토큰 삭제 */
export async function logOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("studentId");
  localStorage.removeItem("userName");
}

/* 토큰 가져오기 (api.js에서 인증 헤더에 쓸 때) */
export function getToken() {
  return localStorage.getItem("token");
}

/* 저장된 로그인 정보 복원 (새로고침 시) */
export function getStoredUser() {
  const token = localStorage.getItem("token");
  const studentId = localStorage.getItem("studentId");
  if (!token || !studentId) return null;
  return { token, studentId, name: localStorage.getItem("userName") || "" };
}

/* 에러 메시지 — 백엔드가 이미 한국어로 주지만, 혹시 모를 경우 대비 */
export function authErrorMessage(message) {
  if (!message) return "문제가 발생했어요. 다시 시도해주세요.";
  // 네트워크 에러는 백엔드 응답이 없어서 메시지가 다르게 옴
  if (message.includes("fetch") || message.includes("network") || message.includes("Failed")) {
    return "네트워크 연결을 확인해주세요.";
  }
  // 그 외엔 백엔드가 준 한국어 메시지 그대로 표시
  return message;
}
export async function signUp({ studentId, password, name }) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, password, name }),
  });
  const data = await res.json();
  if (!data.success) {
    const err = new Error(data.error || "회원가입 실패");
    throw err;
  }
  return data.data;
}