import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, GROWTH } from "../styles/tokens";
import { SproutBadge, Icon } from "../components/Characters";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Shell, TopBar, ConfirmModal } from "../components/Layout";
import { useApp } from "../AppContext";
import { completeInterview } from "../api";

function stageFor(score) {
  if (score >= 90) return 4;
  if (score >= 80) return 3;
  if (score >= 70) return 2;
  if (score >= 60) return 1;
  return 0;
}

function normalize(feedbacks, session) {
  const qTexts = session?.questions?.map((q) => q.content) || [];
  
  if (!feedbacks || feedbacks.length === 0) {
    return {
      score: 0,
      perQ: [],
    };
  }
  
  const perQ = feedbacks.map((f, i) => ({
    question: qTexts[i] || f.question || `질문 ${i + 1}`,
    score: f.score ?? 0,
    strengths: Array.isArray(f.strengths) ? f.strengths : [f.strengths].filter(Boolean),
    improvements: Array.isArray(f.improvements) ? f.improvements : [f.improvements].filter(Boolean),
    suggestion: f.suggestion || "",
    modelAnswer: f.modelAnswer || "",
  }));
  
  const avg = perQ.length > 0 ? Math.round(perQ.reduce((s, p) => s + p.score, 0) / perQ.length) : 0;
  return { score: avg, perQ };
}

export default function Result() {
  const navigate = useNavigate();
  const { config, faceStats, feedbacks, session, totalSec, answers } = useApp();
  const [open, setOpen] = useState(0); // 펼쳐진 질문 인덱스
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  const penalty = Number(sessionStorage.getItem("penalty") || 0);
  const extraCount = JSON.parse(sessionStorage.getItem("extraCount") || "[]");

  const data = normalize(feedbacks, session);

  return (
    <Shell>
      <TopBar />

      <ConfirmModal
      open={showRetryConfirm}
      title="다시 도전하기"
      desc="점수와 피드백이 기록되지 않고 새로운 면접을 시작해요. 계속하시겠어요?"
      onConfirm={() => { setShowRetryConfirm(false); navigate("/setup"); }}
      onCancel={() => setShowRetryConfirm(false)}
      confirmText="계속하기"
      cancelText="취소하기"
      />

      <div style={{ margin: "24px 0 22px" }}>
        <Eyebrow>Result</Eyebrow>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: T.ink, margin: "8px 0 4px" }}>면접 결과</h1>
        <p style={{ fontSize: 14, color: T.inkSoft, margin: 0 }}>
          {config?.job} · {config?.qtype}
          {totalSec > 0 && ` · ${Math.floor(totalSec / 60)}분 ${totalSec % 60}초`}
          {penalty > 0 && <span style={{ color: "#B5503A", marginLeft: 8 }}>⚠️ 감점 -{penalty * 3}점</span>}
        </p>
      </div>

      {/* 총점 카드 */}
      <Card style={{ textAlign: "center", padding: "26px 20px", marginBottom: 16 }}>
        <div style={{ display: "grid", placeItems: "center" }}>
          <SproutBadge size={64} />
        </div>
        <div style={{ marginTop: 12 }}><Eyebrow>Total score</Eyebrow></div>
        <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.04em", color: T.forest, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
          {data.score}
        </div>
        <div style={{ fontSize: 12.5, color: T.inkSoft }}>100점 만점</div>
      </Card>

      {/* 표정·응시 분석 */}
      {faceStats && (
        <Card style={{ padding: "18px 18px 16px", marginBottom: 16 }}>
          <Eyebrow>Presence</Eyebrow>
          <div style={{ marginTop: 12, display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>표정</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{faceStats.smiles}회</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>응시</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{faceStats.gazeRate}%</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>무표정</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{faceStats.neutralRate}%</div>
            </div>
          </div>
        </Card>
      )}

      {/* 아코디언 질문별 피드백 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {data.perQ.map((p, i) => (
          <Card key={i} style={{ padding: 0, overflow: "hidden" }}>
            {/* 헤더 — 클릭하면 펼치기/접기 */}
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 20px", border: "none", background: open === i ? T.amberSoft : "transparent",
                cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                transition: "background .14s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: open === i ? "#92531F" : T.inkSoft }}>
                  Q{i + 1}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: open === i ? "#92531F" : T.ink, lineHeight: 1.4 }}>
                  {p.question}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: GROWTH[stageFor(p.score)] }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: T.forest, fontVariantNumeric: "tabular-nums" }}>
                  {p.score}점<span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 400 }}>/20</span>
                </span>
                <span style={{ color: T.inkFaint, fontSize: 12 }}>{open === i ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* 펼쳐진 피드백 */}
            {open === i && (
              <div style={{ padding: "0 20px 20px" }}>
                {/* 내 답변 */}
                {answers[i]?.answer && (
                  <div style={{ padding: "12px 0", borderTop: `1px solid ${T.line}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>내 답변</div>
                    <div style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {answers[i].answer}
                    </div>
                  </div>
                )}
                {extraCount[i] > 0 && (
                  <div style={{
                    padding: "8px 12px", borderRadius: 8, marginBottom: 8,
                    background: "rgba(181,80,58,0.08)",
                    fontSize: 13, color: "#B5503A", fontWeight: 600,
                    }}>
                      ⏱ 시간 초과 감점: {extraCount[i]}회 (-{extraCount[i] * 3}점)
                    </div>
                  )}
                  
                <FbBlock label="잘한 점" accent={T.forest} items={p.strengths} />
                <FbBlock label="개선할 점" accent={T.amber} items={p.improvements} />
                <FbBlock label="추천 답변 방향" accent={T.sage} items={[p.suggestion]} />
                {/* 모범 답안 예시 */}
                {p.modelAnswer && (
                  <div style={{
                    marginTop: 12, padding: "14px 16px",
                    background: "rgba(59,130,246,0.05)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", marginBottom: 8 }}>
                      STAR 기반 모범 답안 예시
                    </div>
                    <p style={{
                      fontSize: 13.5, color: T.inkMid, lineHeight: 1.7,
                      whiteSpace: "pre-line", margin: 0,
                      }}>
                      {p.modelAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        {/* 왼쪽 */}
        <Btn variant="ghost" onClick={() => setShowRetryConfirm(true)}>
          다시 도전하기
          </Btn>
        {/* 오른쪽 */}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={async () => {
            if (session?.sessionId) await completeInterview(session.sessionId).catch(() => {});
            navigate("/mypage");
          }}>
            <Icon.chart size={17} /> 성장 기록
          </Btn>
          <Btn variant="primary" onClick={async () => {
            if (session?.sessionId) await completeInterview(session.sessionId).catch(() => {});
            navigate("/");
          }}>
            새 면접
          </Btn>
        </div>
      </div>
    </Shell>
  );
}

function FbBlock({ label, accent, items }) {
  const list = (items || []).filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 13, padding: "12px 0", borderTop: `1px solid ${T.line}` }}>
      <div style={{ flex: "0 0 3px", borderRadius: 3, background: accent, alignSelf: "stretch" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 5, letterSpacing: "-0.01em" }}>{label}</div>
        {list.length === 1 ? (
          <div style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.65 }}>{list[0]}</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {list.map((t, i) => (
              <li key={i} style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.6, display: "flex", gap: 8 }}>
                <span style={{ color: accent, flex: "0 0 auto", marginTop: 1 }}>·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}