import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T, GROWTH, sessionsToNextStage } from "../styles/tokens";
import { GrowthBadge, Icon } from "../components/Characters";
import { Card, Eyebrow } from "../components/UI";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";
import { getStats, getHistory, getAnalysis } from "../api";

/* 잔디(달력) 색 단계 — "면접 횟수" 기준 */
function band(count) {
  if (!count || count <= 0) return -1;   // 기록 없음
  if (count >= 4) return 4;
  if (count === 3) return 3;
  if (count === 2) return 2;
  return 0; // 1회
}

/* 최근 이력 점수 배지 색 — "점수" 기준 (잔디의 band와는 별개) */
function scoreBand(s) {
  if (s == null) return -1;
  if (s >= 90) return 4;
  if (s >= 80) return 3;
  if (s >= 70) return 2;
  if (s >= 60) return 1;
  return 0;
}

/* 오늘(또는 어제)부터 거슬러 올라가며 연속 연습일 계산 */
function calcStreak(dayCounts, today) {
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  let cursor = new Date(today);
  if (!dayCounts[fmt(cursor)]) cursor.setDate(cursor.getDate() - 1); // 오늘 기록 없으면 어제부터 확인
  let streak = 0;
  while (dayCounts[fmt(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* history(날짜) → 날짜별 면접 횟수 맵 { "2026-07-22": 2, ... } */
function buildDayCounts(history) {
  const counts = {};
  (history || []).forEach((h) => {
    if (!h.createdAt) return;
    const d = new Date(h.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

/* 특정 연/월의 달력 칸 배열 생성 (앞쪽 빈칸 포함, 1일~말일) */
function buildMonthGrid(year, month, dayCounts) {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0=일요일
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, count: dayCounts[key] || 0 });
  }
  return cells;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/* 면접 모드 뱃지 스타일 */
const MODE_STYLE = {
  텍스트: { bg: T.mist, color: T.forest },
  스피킹: { bg: "#EAF0E3", color: "#4C6B3E" },
  도전:   { bg: T.amberSoft, color: T.amber },
};

function ModeBadge({ mode }) {
  const style = MODE_STYLE[mode] || MODE_STYLE["텍스트"];
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
      background: style.bg, color: style.color, flexShrink: 0,
    }}>
      {mode || "텍스트"}
    </span>
  );
}

export default function Mypage() {
  const navigate = useNavigate();
  const { studentId } = useApp();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, historyData, analysisData] = await Promise.all([
          getStats().catch(() => null),
          getHistory().catch(() => []),
          getAnalysis().catch(() => null),
        ]);

        setStats(statsData);
        setHistory(historyData);
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
        {/* 달력 스켈레톤 */}
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.line}`, padding: 24, marginBottom: 16 }}>
          <div style={{ width: 80, height: 12, borderRadius: 4, background: T.line, marginBottom: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
            {Array.from({ length: 35 }).map((_, i) => (
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

  const colorOf = (c) => (c == null ? T.surfaceAlt : GROWTH[band(c)]);
  const legend = [["4회+", 4], ["3회", 3], ["2회", 2], ["1회", 0]];

  const dayCounts = buildDayCounts(history);
  const now = new Date();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // 지난 2개월 + 이번 달 (오래된 순 → 최신 순)
  const months = [2, 1, 0].map((back) => {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const streak = calcStreak(dayCounts, today);
  const remaining = sessionsToNextStage(stats?.totalSessions ?? 0);

  return (
    <Shell>
      <TopBar showMypage={false} />

      {/* 헤더 — 프로필 (연습 횟수 기준 성장 이미지 + 점수 기준 배지 색상) */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 8px" }}>
        <GrowthBadge score={stats?.avgScore ?? 0} count={stats?.totalSessions ?? 0} size={54} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink }}>
            {studentId} <span style={{ fontSize: 15, fontWeight: 600, color: T.inkMid }}>님</span>
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>
            {streak > 0 ? ` ${streak}일 연속 연습 중` : "오늘부터 연습을 시작해보세요"}
            {remaining != null ? ` · 다음 단계까지 ${remaining}회 남았어요` : " · 최고 단계 도달! 🌳"}
          </div>
        </div>
      </div>

      {/* 성장 배지 설명 문구 */}
      <div style={{ fontSize: 12.5, color: T.inkSoft, margin: "0 0 20px 2px" }}>
        연습 횟수가 늘어날수록 새싹이 나무로 성장합니다! 큰 나무가 될 때까지 함께해요.
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

      {/* 성장 기록 — 달력 3개월치 */}
      <Card style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="calendar-grid">
          {months.map(({ year, month }) => {
            const grid = buildMonthGrid(year, month, dayCounts);
            return (
              <div key={`${year}-${month}`}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkMid, marginBottom: 10, textAlign: "center" }}>
                  {year}년 {month + 1}월
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 5 }}>
                  {WEEKDAYS.map((w) => (
                    <div key={w} style={{ fontSize: 10, color: T.inkFaint, textAlign: "center" }}>{w}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {grid.map((cell, i) => {
                    if (!cell) return <div key={i} />;
                    const cellDate = new Date(year, month, cell.day);
                    const isFuture = cellDate > today;
                    const count = isFuture ? null : (cell.count > 0 ? cell.count : null);
                    const bg = colorOf(count);
                    const isDark = count != null && band(count) >= 2; // 진한 배경일 땐 글자색 밝게
                    return (
                      <div
                        key={i}
                        title={`${year}년 ${month + 1}월 ${cell.day}일 · ${count ? `면접 ${count}회` : "기록 없음"}`}
                        style={{
                          aspectRatio: "1", borderRadius: 4,
                          display: "grid", placeItems: "center",
                          background: bg,
                          border: count == null ? `1px solid ${T.line}` : "none",
                          opacity: isFuture ? 0.45 : 1,
                          fontSize: 10.5,
                          fontWeight: count != null ? 700 : 500,
                          color: isDark ? "#fff" : (count != null ? T.forest : T.inkFaint),
                        }}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
        {(historyExpanded ? history : history.slice(0, 5)).map((h) => {
          const score = h.avgScore == null ? null : Number(h.avgScore);
          return (
            <button key={h.id} onClick={() => navigate("/result")} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 6px", border: "none", borderTop: `1px solid ${T.line}`,
              background: "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}>
                  <ModeBadge mode={h.mode} />
                  {h.jobName} · {h.questionType}
                  {h.isIncomplete && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#B5503A",
                      background: "rgba(181,80,58,0.1)", padding: "2px 8px",
                      borderRadius: 20, letterSpacing: "0.02em",
                    }}>미완료</span>
                    )}
                </div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                  {h.createdAt ? new Date(h.createdAt).toLocaleDateString("ko-KR") : "날짜 없음"} · {h.durationMin != null ? `${h.durationMin}분` : "기록 없음"}
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                {score != null && (
                  <>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: GROWTH[scoreBand(score)] }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.forest, fontVariantNumeric: "tabular-nums" }}>{score}점</span>
                  </>
                )}
                <span style={{ color: T.inkFaint }}><Icon.arrow size={17} /></span>
              </span>
            </button>
          );
        })}
        {history.length > 5 && (
          <button
            onClick={() => setHistoryExpanded((v) => !v)}
            style={{
              width: "100%", marginTop: 4, padding: "12px 6px",
              border: "none", borderTop: `1px solid ${T.line}`,
              background: "transparent", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13.5, fontWeight: 600, color: T.forest, textAlign: "center",
            }}
          >
            {historyExpanded ? "접기" : `전체보기`}
          </button>
        )}
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
      <style>{`
        @media (max-width:560px){
          .stat-grid{ grid-template-columns:1fr 1fr !important; }
          .calendar-grid{ grid-template-columns:1fr !important; }
        }
      `}</style>
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