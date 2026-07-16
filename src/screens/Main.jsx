import React from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../styles/tokens";
import { Icon } from "../components/Characters";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";
import { useState } from "react";
import ChallengeModal from "./ChallengeModal";

const MODES = [
  {
    key: "text", label: "Text", title: "텍스트 면접", icon: Icon.text,
    desc: "질문에 답변을 입력하고 AI 피드백을 받아요.",
    meta: "질문 5개 · 약 10분",
  },
  {
    key: "speaking", label: "Speaking", title: "스피킹 면접", icon: Icon.mic,
    desc: "마이크로 실제처럼 말하며 실전을 연습해요.",
  },
];

export default function Main() {
  const navigate = useNavigate();
  const { setMode } = useApp();
  const[showChallenge, setShowChallenge] = useState(false);
  const startInterview = (m) => { setMode(m); navigate("/setup"); };
  return (
    <Shell>
      <TopBar />

      <div style={{ margin: "24px 0 28px" }}>
        <Eyebrow>Today's practice</Eyebrow>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.025em", color: T.ink, margin: "8px 0 6px" }}>
          어떤 면접을 연습할까요?
        </h1>
        <p style={{ fontSize: 14.5, color: T.inkSoft, margin: 0 }}>모드를 고르면 직무와 질문 유형을 설정할 수 있어요.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="mode-grid">
        {MODES.map((m) => {
          const I = m.icon;
          return (
            <Card key={m.key} hover onClick={() => startInterview(m.key)} style={{ padding: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11, background: T.mist,
                display: "grid", placeItems: "center", color: T.forest, marginBottom: 18,
              }}>
                <I size={22} />
              </div>
              <Eyebrow>{m.label}</Eyebrow>
              <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, margin: "5px 0 10px" }}>{m.title}</h2>
              <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.6, margin: "0 0 18px" }}>{m.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12.5, color: T.inkSoft }}>{m.meta}</span>
                <span style={{ color: T.forest, display: "inline-flex" }}><Icon.arrow size={20} /></span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 도전 모드 */}
      <Card hover onClick={() => setShowChallenge(true)} style={{ padding: 28, marginTop: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, background: T.amberSoft,
          display: "grid", placeItems: "center", color: T.amber, marginBottom: 18,
        }}>

        </div>
        <Eyebrow>Challenge</Eyebrow>
        <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, margin: "5px 0 10px" }}>도전 모드</h2>
        <p style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.6, margin: "0 0 18px" }}>
          질문 1개에 답하고 즉시 AI 피드백을 받아요.
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, color: T.inkSoft }}>질문 1개 · 약 3분</span>
          <span style={{ color: T.amber, display: "inline-flex" }}><Icon.arrow size={20} /></span>
          </div>
        </Card>
        
        {/* 도전 모드 팝업 */}
        {showChallenge && <ChallengeModal onClose={() => setShowChallenge(false)} />}

      <style>{`@media (max-width:640px){ .mode-grid{ grid-template-columns:1fr !important; } }`}</style>
    </Shell>
  );
}
