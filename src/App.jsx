import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { T } from "./styles/tokens";
import { useApp } from "./AppContext";
import { AnimatePresence } from "framer-motion";

// lazy loading으로 변경 (필요할 때만 다운로드)
const Login = lazy(() => import("./screens/Login"));
const Signup = lazy(() => import("./screens/Signup"));
const Main = lazy(() => import("./screens/Main"));
const Setup = lazy(() => import("./screens/Setup"));
const TextInterview = lazy(() => import("./screens/TextInterview"));
const SpeakInterview = lazy(() => import("./screens/SpeakInterview"));
const Loading = lazy(() => import("./screens/Loading"));
const Result = lazy(() => import("./screens/Result"));
const Mypage = lazy(() => import("./screens/Mypage"));
const ForgotPassword = lazy(() => import("./screens/ForgotPassword"));
const TransitionLoading = lazy(() => import("./screens/TransitionLoading"));

/* 로딩 중 보여줄 화면 */
function PageLoader() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: T.inkSoft, fontSize: 14 }}>
      불러오는 중…
    </div>
  );
}

/* 로그인 안 했으면 /login 으로 */
function Protected({ children }) {
  const { studentId, authReady } = useApp();
  const loc = useLocation();
  if (!authReady) return <PageLoader />;
  if (!studentId) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink,
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, system-ui, sans-serif" }}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Protected><Main /></Protected>} />
            <Route path="/setup" element={<Protected><Setup /></Protected>} />
            <Route path="/interview/text" element={<Protected><TextInterview /></Protected>} />
            <Route path="/interview/speak" element={<Protected><SpeakInterview /></Protected>} />
            <Route path="/loading" element={<Protected><Loading /></Protected>} />
            <Route path="/result/:sessionId" element={<Protected><Result /></Protected>} />
            <Route path="/mypage" element={<Protected><Mypage /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/transition" element={<Protected><TransitionLoading /></Protected>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </div>
  );
}