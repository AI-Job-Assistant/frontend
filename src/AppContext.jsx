import React, { createContext, useContext, useState, useEffect } from "react";
import { getStoredUser, logOut } from "./auth";

/* ============================================================
   앱 전역 상태
   - studentId: localStorage에서 자동 복원 (새로고침해도 유지)
   - mode/config: 면접 진행용 (URL 간 공유)
   ============================================================ */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [studentId, setStudentId] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // 인증 확인 끝났는지

  const [mode, setMode] = useState("text");          // text | speaking
  const [config, setConfig] = useState(null);        // { job, qtype, itype }

  /* 새로고침 시 localStorage에서 로그인 정보 복원 */
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setStudentId(stored.studentId);
    }
    setAuthReady(true); // Firebase처럼 비동기 대기 없이 바로 완료
  }, []);

  const [faceStats, setFaceStats] = useState(null);  // { smiles, gazeRate }
  const [totalSec, setTotalSec] = useState(0);

  // 면접 1회분 — 질문 생성 응답 보관 (sessionId·questions[])
  const [session, setSession] = useState(null);

  // 면접 화면이 모은 답변 (Loading이 채점 API에 넘김)
  const [answers, setAnswers] = useState([]);

  // 답변 평가 응답 누적 (Result 화면에서 표시)
  const [feedbacks, setFeedbacks] = useState([]);

  const value = {
    studentId, setStudentId, user, authReady,
    mode, setMode,
    config, setConfig,
    faceStats, setFaceStats,
    totalSec, setTotalSec,
    session, setSession,
    answers, setAnswers,
    feedbacks, setFeedbacks,
    logout: async () => {
      await logOut();
      setUser(null);
      setStudentId("");
      setConfig(null);
      setSession(null);
      setAnswers([]);
      setFeedbacks([]);
      setFaceStats(null);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}