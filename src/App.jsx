import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { T } from "./styles/tokens";
import { useApp } from "./AppContext";

import Login from "./screens/Login";
import Signup from "./screens/Signup";
import Main from "./screens/Main";
import Setup from "./screens/Setup";
import TextInterview from "./screens/TextInterview";
import SpeakInterview from "./screens/SpeakInterview";
import Loading from "./screens/Loading";
import Result from "./screens/Result";
import Mypage from "./screens/Mypage";

/* 로그인 안 했으면 /login 으로. 단, Firebase 인증 확인 전엔 잠깐 대기 */
function Protected({ children }) {
  const { studentId, authReady } = useApp();
  const loc = useLocation();
  if (!authReady) {
    // 새로고침 직후 Firebase가 로그인 상태를 확인하는 짧은 순간
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: T.inkSoft, fontSize: 14 }}>
        불러오는 중…
      </div>
    );
  }
  if (!studentId) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink,
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif" }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={<Protected><Main /></Protected>} />
        <Route path="/setup" element={<Protected><Setup /></Protected>} />
        <Route path="/interview/text" element={<Protected><TextInterview /></Protected>} />
        <Route path="/interview/speak" element={<Protected><SpeakInterview /></Protected>} />
        <Route path="/loading" element={<Protected><Loading /></Protected>} />
        <Route path="/result" element={<Protected><Result /></Protected>} />
        <Route path="/mypage" element={<Protected><Mypage /></Protected>} />

        {/* 없는 경로는 메인으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
