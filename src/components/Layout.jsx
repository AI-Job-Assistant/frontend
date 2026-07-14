import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../styles/tokens";
import { Logo, Btn } from "./UI";
import { Icon } from "./Characters";
import { useApp } from "../AppContext";
import { motion } from "framer-motion";

export function Shell({ children, width = 820 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ maxWidth: width, margin: "0 auto", padding: "20px 24px 72px" }}
    >
      {children}
    </motion.div>
  );
}

export function Centered({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}
    >
      {children}
    </motion.div>
  );
}

export function TopBar({ showMypage = true, onQuit })  {
  const navigate = useNavigate();
  const { studentId, logout } = useApp();
  const onLogout = async () => { await logout(); navigate("/login"); };
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0 20px", marginBottom: 12, borderBottom: `1px solid ${T.line}`,
    }}>
      <Logo onClick={onQuit || (() => navigate("/"))} />
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {studentId && (
          <span style={{
            fontSize: 13, color: T.inkMid, fontWeight: 600, padding: "6px 12px",
            background: T.surfaceAlt, borderRadius: 8, marginRight: 4,
            fontVariantNumeric: "tabular-nums",
          }}>{studentId}</span>
        )}
        {showMypage && (
          <Btn variant="ghost" style={{ padding: "8px 12px" }} onClick={() => navigate("/mypage")}>
            <Icon.user size={17} /> 마이페이지
          </Btn>
        )}
        <Btn variant="ghost" style={{ padding: "8px 12px", color: T.inkSoft }} onClick={onLogout} aria-label="로그아웃">
          <Icon.logout size={17} />
        </Btn>
      </div>
    </div>
  );
}

/* 진행 바 — 가는 라인 + 채워지는 마디 5개 */
export function Progress({ idx, total = 5 }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: 3, flex: 1, borderRadius: 2,
          background: i < idx ? T.forest : i === idx ? T.amber : T.line,
          transition: "background .25s",
        }} />
      ))}
      <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: T.inkSoft, fontVariantNumeric: "tabular-nums" }}>
        {idx + 1}/{total}
      </span>
    </div>
  );
}

export function Timer({ sec }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 700,
      color: T.inkMid, letterSpacing: "0.02em",
    }}>
      <Icon.clock size={15} /> {fmt(sec)}
    </span>
  );
}

export function useTimer(running) {
  const [sec, setSec] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) ref.current = setInterval(() => setSec((s) => s + 1), 1000);
    else if (ref.current) clearInterval(ref.current);
    return () => ref.current && clearInterval(ref.current);
  }, [running]);
  return [sec, () => setSec(0)];
}

export function fmt(s) {
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

/* 중단 확인 모달 */
export function ConfirmModal({ open, title, desc, onConfirm, onCancel, confirmText = "나가기", cancelText = "계속 진행" }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.45)",
      display: "grid", placeItems: "center", padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        style={{
          background: T.surface, borderRadius: 16, padding: "32px 28px",
          maxWidth: 360, width: "100%", textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.6, margin: "0 0 24px" }}>{desc}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" full onClick={onCancel}>{cancelText}</Btn>
          <Btn variant="accent" full onClick={onConfirm}>{confirmText}</Btn>
        </div>
      </motion.div>
    </div>
  );
}

/* 페이지 전환 애니메이션 래퍼 */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}