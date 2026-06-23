import React from "react";
import { useNavigate } from "react-router-dom";
import { T, GROWTH } from "../styles/tokens";
import { SproutBadge, Icon } from "../components/Characters";
import { Card, Eyebrow } from "../components/UI";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";

function band(s) {
  if (s == null) return -1;
  if (s >= 90) return 4;
  if (s >= 80) return 3;
  if (s >= 70) return 2;
  if (s >= 60) return 1;
  return 0;
}

export default function Mypage() {
  const navigate = useNavigate();
  const { studentId } = useApp();
  const scores = [92, 81, 73, 65, 88, 79, 70, 61, 84, 77, 68, 90];
  const cells = Array.from({ length: 91 }, (_, i) => scores[i] ?? null);
  const colorOf = (s) => (s == null ? T.surfaceAlt : GROWTH[band(s)]);
  const legend = [["90+", 4], ["80+", 3], ["70+", 2], ["60+", 1], ["~59", 0]];
  const history = [
    ["데이터 분석가", "직무·기술형", "2026.06.06", "15분", 84],
    ["데이터 분석가", "경험·행동형", "2026.06.06", "15분", 77],
    ["데이터 분석가", "상황 판단형", "2026.06.06", "15분", 90],
  ];

  return (
    <Shell>
      <TopBar showMypage={false} />

      {/* 헤더 — 프로필 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 20px" }}>
        <SproutBadge size={54} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink }}>
            {studentId} <span style={{ fontSize: 15, fontWeight: 600, color: T.inkMid }}>님</span>
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>데이터 분석가 · 신입 · 가입 2개월차</div>
        </div>
      </div>

      {/* 통계 3칸 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }} className="stat-grid">
        <Stat label="Total sessions" ko="총 연습" value="12" unit="회" />
        <Stat label="Average score" ko="평균 점수" value="78" unit="점" />
        <Stat label="This month" ko="이번 달 변화" value="+12" unit="점" accent />
      </div>

      {/* 성장 잔디 */}
      <Card style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <Eyebrow>Activity</Eyebrow>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: "3px 0 0", letterSpacing: "-0.01em" }}>성장 기록</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: T.inkSoft }}>낮음</span>
            {legend.slice().reverse().map(([, b]) => (
              <span key={b} style={{ width: 12, height: 12, borderRadius: 3, background: GROWTH[b] }} />
            ))}
            <span style={{ fontSize: 11.5, color: T.inkSoft }}>높음</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 5 }}>
          {cells.map((s, i) => (
            <div key={i} title={s ? `${s}점` : "기록 없음"} style={{
              aspectRatio: "1", borderRadius: 4, background: colorOf(s),
              border: s == null ? `1px solid ${T.line}` : "none",
            }} />
          ))}
        </div>
      </Card>

      {/* 최근 이력 */}
      <Card style={{ padding: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <Eyebrow>Recent</Eyebrow>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: "3px 0 0", letterSpacing: "-0.01em" }}>최근 면접 이력</h3>
        </div>
        {history.map((h, i) => (
          <button key={i} onClick={() => navigate("/result")} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 6px", border: "none", borderTop: `1px solid ${T.line}`,
            background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
          }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{h[0]} · {h[1]}</div>
              <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{h[2]} · {h[3]}</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: GROWTH[band(h[4])] }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.forest, fontVariantNumeric: "tabular-nums" }}>{h[4]}점</span>
              <span style={{ color: T.inkFaint }}><Icon.arrow size={17} /></span>
            </span>
          </button>
        ))}
      </Card>
      <style>{`@media (max-width:560px){ .stat-grid{ grid-template-columns:1fr 1fr !important; } }`}</style>
    </Shell>
  );
}

function Stat({ label, ko, value, unit, accent }) {
  return (
    <Card style={{ padding: "18px 20px" }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ fontSize: 13, color: T.inkSoft, margin: "2px 0 6px" }}>{ko}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent ? T.forest : T.ink, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
        {value}<span style={{ fontSize: 15, color: T.inkSoft, fontWeight: 600 }}> {unit}</span>
      </div>
    </Card>
  );
}
