import React from "react";
import { T } from "../styles/tokens";
import { Sprout } from "./Characters";

/* 로고 — 워드마크 + 미니 새싹 */
export function Logo({ onClick }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 9, cursor: onClick ? "pointer" : "default" }}>
      <Sprout size={26} />
      <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: T.ink }}>새싹</span>
    </div>
  );
}

/* eyebrow — 작은 영문 라벨 */
export function Eyebrow({ children, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
      color: color || T.sage,
    }}>{children}</span>
  );
}

/* 버튼 */
export function Btn({ children, onClick, variant = "primary", style, disabled, type, full, "aria-label": ariaLabel }) {
  const [hovered, setHovered] = React.useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    border: "1px solid transparent", borderRadius: 10, padding: "11px 18px",
    fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em",
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
    whiteSpace: "nowrap",
    transition: "background .15s, border-color .15s, color .15s, transform .06s",
    opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
  };
  const variants = {
    primary: { background: T.forest, color: "#fff" },
    accent: { background: T.amber, color: "#fff" },
    outline: { background: "transparent", color: T.ink, borderColor: T.lineStrong },
    ghost: { background: "transparent", color: T.inkMid },
    soft: { background: T.mist, color: T.forest },
  };
  return (
    <button
      type={type || "button"} onClick={onClick} disabled={disabled}
      aria-label={ariaLabel}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

/* 입력 필드 */
export function Field({ label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.inkMid, marginBottom: 7 }}>{label}</span>
      <input
        {...props}
        style={{
          width: "100%", boxSizing: "border-box", padding: "11px 13px",
          borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 14.5,
          background: T.surface, color: T.ink, outline: "none", fontFamily: "inherit",
          transition: "border-color .15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.sage)}
        onBlur={(e) => (e.target.style.borderColor = T.line)}
      />
    </label>
  );
}

export function SelectField({ label, options, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.inkMid, marginBottom: 7 }}>{label}</span>
      <select
        {...props}
        style={{
          width: "100%", boxSizing: "border-box", padding: "11px 13px",
          borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 14.5,
          background: T.surface, color: props.value ? T.ink : T.inkMid,
          outline: "none", fontFamily: "inherit", transition: "border-color .15s",
          appearance: "none", cursor: "pointer",
        }}
        onFocus={(e) => (e.target.style.borderColor = T.sage)}
        onBlur={(e) => (e.target.style.borderColor = T.line)}
      >
        <option value="" disabled>학과를 선택하세요</option>
        {options.map((o) =>
          typeof o === "object" ? (
            <option key={o.value} value={o.value}>{o.label}</option>
          ) : (
            <option key={o} value={o}>{o}</option>
          )
        )}
      </select>
    </label>
  );
}

/* 카드 — 그림자 제거, 얇은 보더 */
export function Card({ children, style, onClick, hover }) {
  const [h, setH] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: T.surface, borderRadius: 14,
        border: `1px solid ${h ? T.lineStrong : T.line}`,
        padding: 24, cursor: onClick ? "pointer" : "default",
        transition: "border-color .15s, transform .15s",
        transform: h ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* 선택 칩 — 선택 시 앰버 보더 + 연한 배경 */
export function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? T.amber : T.line}`,
        background: active ? T.amberSoft : T.surface,
        color: active ? "#92531F" : T.inkMid,
        borderRadius: 9, padding: "9px 15px", fontSize: 13.5,
        fontWeight: active ? 600 : 500, cursor: "pointer", fontFamily: "inherit",
        transition: "all .14s", letterSpacing: "-0.01em",
      }}
    >
      {children}
    </button>
  );
}

export function Section({ label, title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 11 }}>
        {label && <div style={{ marginBottom: 3 }}><Eyebrow>{label}</Eyebrow></div>}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}