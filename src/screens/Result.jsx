import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, QUESTIONS, FEEDBACK, GROWTH } from "../styles/tokens";
import { Sprout, SproutBadge, Icon } from "../components/Characters";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";

function stageFor(score) {
  if (score >= 90) return 4;
  if (score >= 80) return 3;
  if (score >= 70) return 2;
  if (score >= 60) return 1;
  return 0;
}

export default function Result() {
  const navigate = useNavigate();
  const { config } = useApp();
  const [sel, setSel] = useState(0);
  const q = FEEDBACK.perQ[sel];

  return (
    <Shell>
      <TopBar />

      <div style={{ margin: "24px 0 22px" }}>
        <Eyebrow>Result</Eyebrow>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: T.ink, margin: "8px 0 4px" }}>면접 결과</h1>
        <p style={{ fontSize: 14, color: T.inkSoft, margin: 0 }}>{config?.job} · {config?.qtype}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "248px 1fr", gap: 16 }} className="res-grid">
        {/* 좌 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ textAlign: "center", padding: "26px 20px" }}>
            <div style={{ display: "grid", placeItems: "center" }}>
              <SproutBadge size={64} />
            </div>
            <div style={{ marginTop: 12 }}><Eyebrow>Total score</Eyebrow></div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", color: T.forest, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
              {FEEDBACK.score}
            </div>
            <div style={{ fontSize: 12.5, color: T.inkSoft }}>100점 만점</div>
          </Card>
          <Card style={{ padding: 8 }}>
            {FEEDBACK.perQ.map((p, i) => (
              <button key={i} onClick={() => setSel(i)} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 13px", borderRadius: 9, cursor: "pointer", border: "none",
                background: sel === i ? T.amberSoft : "transparent", fontFamily: "inherit",
                transition: "background .14s", textAlign: "left",
              }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: sel === i ? "#92531F" : T.inkMid }}>질문 {i + 1}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: GROWTH[stageFor(p.score)] }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.forest, fontVariantNumeric: "tabular-nums" }}>{p.score}</span>
                </span>
              </button>
            ))}
          </Card>
        </div>

        {/* 우 */}
        <Card style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <Eyebrow>Question {String(sel + 1).padStart(2, "0")}</Eyebrow>
            <span style={{ fontSize: 24, fontWeight: 800, color: T.forest, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{q.score}<span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 600 }}> /100</span></span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.ink, lineHeight: 1.5, letterSpacing: "-0.01em", margin: "4px 0 22px" }}>{QUESTIONS[sel]}</h2>

          <FbBlock label="잘한 점" accent={T.forest} text={q.strength} />
          <FbBlock label="개선할 점" accent={T.amber} text={q.improve} />
          <FbBlock label="추천 답변 방향" accent={T.sage} text={q.suggest} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <Btn variant="outline" onClick={() => navigate("/mypage")}><Icon.chart size={17} /> 성장 기록</Btn>
            <Btn variant="primary" onClick={() => navigate("/")}>새 면접</Btn>
          </div>
        </Card>
      </div>

      <style>{`@media (max-width:680px){ .res-grid{ grid-template-columns:1fr !important; } }`}</style>
    </Shell>
  );
}

function FbBlock({ label, accent, text }) {
  return (
    <div style={{ display: "flex", gap: 13, padding: "12px 0", borderTop: `1px solid ${T.line}` }}>
      <div style={{ flex: "0 0 3px", borderRadius: 3, background: accent, alignSelf: "stretch" }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 3, letterSpacing: "-0.01em" }}>{label}</div>
        <div style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65 }}>{text}</div>
      </div>
    </div>
  );
}
