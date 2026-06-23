import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { emailToStudentId, logOut } from "./auth";

/* ============================================================
   앱 전역 상태
   - studentId: Firebase 로그인 상태에서 자동 복원 (새로고침해도 유지)
   - mode/config: 면접 진행용 (URL 간 공유)
   ============================================================ */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [studentId, setStudentId] = useState("");    // 로그인한 학번
  const [user, setUser] = useState(null);            // Firebase user 객체
  const [authReady, setAuthReady] = useState(false); // 첫 인증 확인 끝났는지
  const [mode, setMode] = useState("text");          // text | speaking
  const [config, setConfig] = useState(null);        // { job, qtype, itype }

  /* Firebase 로그인 상태 구독 — 로그인/로그아웃/새로고침 시 자동 반영 */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setStudentId(u ? emailToStudentId(u.email) : "");
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const value = {
    studentId, user, authReady,
    mode, setMode,
    config, setConfig,
    logout: async () => { await logOut(); setConfig(null); },
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
