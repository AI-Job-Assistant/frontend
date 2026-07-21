import React from "react";
import { T } from "../styles/tokens";
import sproutImg from "../assets/sprout.png";

/* ============================================================
   새싹 — 손그림 일러스트(PNG)
   stage(0~4)는 결과/마이페이지에서 작은 단계 배지로 표시
   ============================================================ */
export function Sprout({ size = 48, alt = "새싹", style }) {
  return (
    <img
      src={sproutImg}
      alt={alt}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block", ...style }}
    />
  );
}

/* 원형 프레임에 담은 새싹 — 프로필/로고용 */
export function SproutBadge({ size = 52, bg = T.mist, pad = 0.18 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "grid", placeItems: "center", flex: "0 0 auto",
    }}>
      <Sprout size={Math.round(size * (1 - pad))} />
    </div>
  );
}

/* ---------- 라인 아이콘 (1.7 stroke, currentColor) ---------- */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

export const Icon = {
  text: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><path d="M4 6h16M4 12h16M4 18h10"/></svg>,
  mic: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>,
  stop: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><rect x="6" y="6" width="12" height="12" rx="2"/></svg>,
  arrow: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><path d="M5 13l4 4L19 7"/></svg>,
  user: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>,
  logout: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><path d="M15 4h4v16h-4M11 8l-4 4 4 4M7 12h10"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  cam: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>,
  chart: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7"/></svg>,
  target: (p) => <svg viewBox="0 0 24 24" width={p.size||20} height={p.size||20} {...ic}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.5"/></svg>,
};