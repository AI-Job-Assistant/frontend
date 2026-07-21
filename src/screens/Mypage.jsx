import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T, GROWTH } from "../styles/tokens";
import { SproutBadge, Icon } from "../components/Characters";
import { Card, Eyebrow } from "../components/UI";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";
import { getStats, getHistory, getHeatmap, getAnalysis } from "../api";

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

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData, heatmapData, analysisData] = await Promise.all([
          getStats().catch(() => null),
          getHistory().catch(() => []),
          getHeatmap().catch(() => []),
          getAnalysis().catch(() => null),
        ]);
        
        setStats(statsData);
        setHistory(historyData);
        setHeatmap(heatmapData);
        setAnalysis(analysisData);
      } catch (e) {
        console.error("[Mypage] 데이터 로딩 실패:", e);
      } finally {
        setAnalysisLoading(false);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Shell>
        <TopBar showMypage={false} />
        {/* 프로필 스켈레톤 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 20px" }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", background: T.line }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: 120, height: 16, borderRadius: 6, background: T.line }} />
            <div style={{ width: 180, height: 12, borderRadius: 6, background: T.surfaceAlt }} />
          </div>
        </div>
        {/* 통계 3칸 스켈레톤 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.line}`, padding: "18px 20px" }}>
              <div style={{ width: 80, height: 10, borderRadius: 4, background: T.line, marginBottom: 8 }} />
              <div style={{ width: 60, height: 30, borderRadius: 6, background: T.surfaceAlt }} />
            </div>
          ))}
        </div>
        {/* 잔디 스켈레톤 */}
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.line}`, padding: 24, marginBottom: 16 }}>
          <div style={{ width: 80, height: 12, borderRadius: 4, background: T.line, marginBottom: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 5 }}>
            {Array.from({ length: 91 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 4, background: T.surfaceAlt }} />
            ))}
          </div>
        </div>
        {/* 이력 스켈레톤 */}
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.line}`, padding: 24 }}>
          <div style={{ width: 100, height: 12, borderRadius: 4, background: T.line, marginBottom: 16 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: "14px 0", borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ width: 160, height: 13, borderRadius: 4, background: T.line }} />
                <div style={{ width: 100, height: 10, borderRadius: 4, background: T.surfaceAlt }} />
              </div>
              <div style={{ width: 40, height: 20, borderRadius: 4, background: T.surfaceAlt }} />
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  const cells = Array.from({ length: 91 }, (_, i) => {
    const h = heatmap[i];
    return h ? Number(h.avgScore) : null;
  });

  const colorOf = (s) => (s == null || isNaN(s) ? T.surfaceAlt : GROWTH[band(s)]);
  const legend = [["90+", 4], ["80+", 3], ["70+", 2], ["60+", 1], ["~59", 0]];

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
        <Stat label="Total sessions" ko="총 연습" value={stats?.totalSessions ?? 0} unit="회" />
        <Stat label="Average score" ko="평균 점수" value={stats?.avgScore ?? 0} unit="점" />
        <Stat
          label="This month" ko="이번 달 변화"
          value={(stats?.monthlyChange >= 0 ? "+" : "") + (stats?.monthlyChange ?? 0)}
          unit="점" accent
        />
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
        {history.length === 0 && (
          <p style={{ color: T.inkSoft, fontSize: 13.5, padding: "10px 6px" }}>아직 면접 기록이 없어요.</p>
        )}
        {history.map((h) => {
          const score = h.avgScore == null ? null : Number(h.avgScore);
          return (
            <button key={h.id} onClick={() => navigate("/result")} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 6px", border: "none", borderTop: `1px solid ${T.line}`,
              background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{h.jobName} · {h.questionType}</div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                  {h.createdAt ? new Date(h.createdAt).toLocaleDateString("ko-KR") : "날짜 없음"} · {h.durationMin != null ? `${h.durationMin}분` : "기록 없음"}
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                {score != null && (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: GROWTH[band(score)] }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.forest, fontVariantNumeric: "tabular-nums" }}>{score}점</span>
                  </>
                )}
                <span style={{ color: T.inkFaint }}><Icon.arrow size={17} /></span>
              </span>
            </button>
          );
        })}
      </Card>

      {/* AI 강점·약점 분석 */}
      <Card style={{ padding: 24, marginTop: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <Eyebrow>AI Analysis</Eyebrow>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: "3px 0 0", letterSpacing: "-0.01em" }}>강점 · 약점 분석</h3>
        </div>
        {analysisLoading ? (
          <p style={{ color: T.inkSoft, fontSize: 13.5 }}>분석 중...</p>
        ) : !analysis?.hasData ? (
          <p style={{ color: T.inkSoft, fontSize: 13.5 }}>{analysis?.message || "아직 분석할 면접 기록이 없어요."}</p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: T.inkSoft, marginBottom: 14 }}>{analysis.basedOn}회 면접 기반 분석</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ padding: "14px 16px", borderRadius: 10, background: T.mist }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.forest, marginBottom: 8 }}>💪 대표 강점</div>
                {analysis.topStrengths?.map((s, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.6 }}>· {s}</div>
                ))}
              </div>
              <div style={{ padding: "14px 16px", borderRadius: 10, background: T.amberSoft }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.amber, marginBottom: 8 }}>🎯 보완할 점</div>
                {analysis.topWeaknesses?.map((w, i) => (
                  <div key={i} style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.6 }}>· {w}</div>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.7, margin: 0 }}>{analysis.summary}</p>
          </>
        )}
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