import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  const [resultSessionId, setResultSessionId] = useState(null); // ← 추가: faceStats/totalSec가 어느 세션 것인지 표시

  // 면접 1회분 — 질문 생성 응답 보관 (sessionId·questions[])
  const [session, setSession] = useState(null);

  // 면접 화면이 모은 답변 (Loading이 채점 API에 넘김)
  const [answers, setAnswers] = useState([]);

  // 답변 평가 응답 누적 (Result 화면에서 표시)
  const [feedbacks, setFeedbacks] = useState([]);

  /* ------------------------------------------------------------
     스피킹 모드 선택 즉시 카메라를 미리 켜두기 위한 저장소
     Main에서 "스피킹" 카드를 누르는 순간 prewarmCamera()를 호출해
     Setup 화면에서 질문 생성 API를 기다리는 동안 백그라운드로
     권한 요청 + 스트림 확보를 시작한다.

     mediaStreamRef: 예열이 이미 끝난 스트림
     mediaStreamPromiseRef: 예열이 아직 진행 중인 Promise
       → SpeakInterview가 더 일찍 도착해도 이 Promise를 기다렸다가
         같은 스트림을 그대로 재사용하므로, 카메라를 두 번 여닫는
         일이 없다.
  ------------------------------------------------------------ */
  const mediaStreamRef = useRef(null);
  const mediaStreamPromiseRef = useRef(null);
  const [cameraPrewarmed, setCameraPrewarmed] = useState(false);

  const prewarmCamera = () => {
    if (mediaStreamRef.current || mediaStreamPromiseRef.current) return; // 이미 예열 중/완료
    setCameraPrewarmed(true);
    mediaStreamPromiseRef.current = navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        mediaStreamPromiseRef.current = null;
        return stream;
      })
      .catch((e) => {
        console.warn("[prewarmCamera] 실패:", e);
        mediaStreamPromiseRef.current = null;
        throw e;
      });
  };

  // 완료됐으면 즉시, 아직 진행 중이면 끝날 때까지 기다렸다가 스트림을 넘겨준다
  const consumePrewarmedCamera = async () => {
    setCameraPrewarmed(false);
    if (mediaStreamRef.current) {
      const s = mediaStreamRef.current;
      mediaStreamRef.current = null;
      return s;
    }
    if (mediaStreamPromiseRef.current) {
      try {
        const s = await mediaStreamPromiseRef.current;
        mediaStreamRef.current = null;
        return s;
      } catch {
        return null;
      }
    }
    return null;
  };

  const releasePrewarmedCamera = () => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    mediaStreamPromiseRef.current = null;
    setCameraPrewarmed(false);
  };

  const value = {
    studentId, setStudentId, user, authReady,
    mode, setMode,
    config, setConfig,
    faceStats, setFaceStats,
    totalSec, setTotalSec,
    resultSessionId, setResultSessionId, // ← 추가
    session, setSession,
    answers, setAnswers,
    feedbacks, setFeedbacks,
    cameraPrewarmed, prewarmCamera, consumePrewarmedCamera, releasePrewarmedCamera,
    logout: async () => {
      releasePrewarmedCamera();
      await logOut();
      setUser(null);
      setStudentId("");
      setConfig(null);
      setSession(null);
      setAnswers([]);
      setFeedbacks([]);
      setFaceStats(null);
      setTotalSec(0);
      setResultSessionId(null); // ← 추가
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}