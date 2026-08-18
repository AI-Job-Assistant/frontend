import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { T, GROWTH } from "../styles/tokens";
import { SproutBadge, Icon } from "../components/Characters";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Shell, TopBar, ConfirmModal } from "../components/Layout";
import { useApp } from "../AppContext";
import { completeInterview, getResultDetail, evaluateAnswer } from "../api";

function stageFor(score) {
  if (score >= 90) return 4;
  if (score >= 80) return 3;
  if (score >= 70) return 2;
  if (score >= 60) return 1;
  return 0;
}

// ponytail: 재분석 시 백엔드가 같은 questionId로 새 결과를 append함(덮어쓰기 아님) → 문항 수·총점 부풀림 방지용 중복 제거. 백엔드가 update로 고쳐지면 제거
function dedupeByQuestion(results) {
  const byId = new Map();
  results.forEach((r, idx) => {
    byId.set(r.questionId ?? `__idx_${idx}`, r);
  });
  return [...byId.values()];
}

function normalize(results) {
  if (!results || results.length === 0) {
    return { score: 0, perQ: [] };
  }

  const deduped = dedupeByQuestion(results);

  const perQ = deduped.map((r) => {
    const noAnswer = !r.answer;

    const strengths = Array.isArray(r.strengths) ? r.strengths : [r.strengths].filter(Boolean);
    const improvements = Array.isArray(r.improvements) ? r.improvements : [r.improvements].filter(Boolean);

    // AI 분석 실패 여부 감지 (백엔드가 실패 시 보내는 고정 문구만 정확히 매칭 — 느슨한 키워드 매칭은 정상 답변 오탐 유발)
    const FAIL_PHRASES = ["분석에 실패", "일시적으로 지연되었습니다", "일시적인 오류로"];
    const failText = [...strengths, ...improvements, r.suggestion, r.modelAnswer].filter(Boolean).join(" ");
    // 답변은 제출했는데 개선할 점/추천 답변/모범 답안 중 하나라도 안 나온 경우도 분석 실패로 간주
    const missingFeedback = !noAnswer && (improvements.length === 0 || !r.suggestion || !r.modelAnswer);
    const analysisFailed = FAIL_PHRASES.some((phrase) => failText.includes(phrase)) || missingFeedback;

    return {
      questionId: r.questionId, // ← 재분석 요청 시 필요
      question: r.question || "",
      answer: r.answer || "",
      score: r.score ?? 0,
      hasAnswer: !noAnswer,
      analysisFailed, // ← 추가
      strengths: strengths.length > 0 ? strengths : (noAnswer ? ["답변을 제출하지 않은 질문입니다."] : []),
      improvements: improvements.length > 0 ? improvements : (noAnswer ? ["답변을 제출하지 않은 질문입니다."] : []),
      suggestion: r.suggestion || (noAnswer ? "답변을 제출하지 않은 질문입니다." : ""),
      modelAnswer: r.modelAnswer || "",
    };
  });

  const total = perQ.reduce((s, p) => s + p.score, 0);
  return { score: total, perQ };
}


export default function Result() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const { faceStats, totalSec, resultSessionId } = useApp();

  const [session, setSession] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(0);
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  const [refreshingIdx, setRefreshingIdx] = useState(null); // ← 추가: 재분석 중인 문항 index

  const penalty = Number(sessionStorage.getItem("penalty") || 0);
  const extraCount = JSON.parse(sessionStorage.getItem("extraCount") || "[]");

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!sessionId) return;
      setLoading(true);
      setError(false);
      try {
        const detail = await getResultDetail(sessionId);
        if (ignore) return;
        setSession(detail.session);
        setResults(detail.results || []);
      } catch (e) {
        console.warn("[Result] 조회 실패:", e.message);
        if (!ignore) setError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [sessionId]);

  const data = normalize(results);

  // 분석 실패한 문항 재요청
  const retryAnalysis = async (i) => {
    const p = data.perQ[i];
    setRefreshingIdx(i);
    try {
      const updated = await evaluateAnswer({
        questionId: p.questionId,
        question: p.question,
        answer: p.answer,
        questionType: session?.questionType,
        extra: sessionId ? { sessionId } : undefined,
      });
      setResults((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], ...updated };
        return next;
      });
      if (sessionId) await completeInterview(sessionId).catch(() => { });
    } catch (e) {
      console.warn("[Result] 재분석 실패:", e.message);
    } finally {
      setRefreshingIdx(null);
    }
  };

  if (loading) {
    return (
      <Shell>
        <TopBar />
        <div style={{ padding: "60px 0", textAlign: "center", color: T.inkSoft }}>결과를 불러오는 중...</div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <TopBar />
        <div style={{ padding: "60px 0", textAlign: "center", color: T.inkSoft }}>
          결과를 불러오지 못했어요.
          <div style={{ marginTop: 12 }}>
            <Btn variant="outline" onClick={() => navigate("/mypage")}>마이페이지로 돌아가기</Btn>
          </div>
        </div>
      </Shell>
    );
  }

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
          {session?.jobName} · {session?.questionType}
          {totalSec > 0 && ` · ${Math.floor(totalSec / 60)}분 ${totalSec % 60}초`}
          {penalty > 0 && <span style={{ color: "#B5503A", marginLeft: 8 }}>⚠️ 감점 -{penalty * 3}점</span>}
        </p>
      </div>

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

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {data.perQ.map((p, i) => (
          <Card key={i} style={{ padding: 0, overflow: "hidden" }}>
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
                  {p.score}점<span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 400 }}>/{session?.mode === "도전" ? 100 : 20}</span>
                </span>
                {p.analysisFailed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); retryAnalysis(i); }}
                    disabled={refreshingIdx === i}
                    title="다시 분석하기"
                    style={{
                      display: "grid", placeItems: "center", padding: 4, border: "none",
                      background: "transparent", color: T.forest, cursor: refreshingIdx === i ? "default" : "pointer",
                      animation: refreshingIdx === i ? "spin 1s linear infinite" : "none",
                    }}
                  >
                    <Icon.refresh size={15} />
                  </button>
                )}
                <span style={{ color: T.inkFaint, fontSize: 12 }}>{open === i ? "▲" : "▼"}</span>
              </div>
            </button>

            {open === i && (
              <div style={{ padding: "0 20px 20px" }}>
                {p.answer && (
                  <div style={{ padding: "12px 0", borderTop: `1px solid ${T.line}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>내 답변</div>
                    <div style={{ fontSize: 14, color: T.inkMid, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {p.answer}
                    </div>
                  </div>
                )}
                {extraCount[i] > 0 && (
                  <div style={{
                    padding: "8px 12px", borderRadius: 8, marginBottom: 8,
                    background: "rgba(181,80,58,0.08)",
                    fontSize: 13, color: "#92531F", fontWeight: 600,
                  }}>
                    ⏱ 시간 초과 감점: {extraCount[i]}회 (-{extraCount[i] * 3}점)
                  </div>
                )}

                {/* ← 여기서부터 분석 실패 여부로 분기 */}
                {p.analysisFailed ? (
                  <div style={{
                    marginTop: 12, padding: 16, borderRadius: 10,
                    background: "rgba(181,80,58,0.08)",
                    textAlign: "center",
                  }}>
                    <p style={{ fontSize: 13.5, color: "#B5503A", fontWeight: 600, margin: "0 0 10px" }}>
                      AI 분석에 실패했어요
                    </p>
                    <Btn
                      variant="outline"
                      onClick={() => retryAnalysis(i)}
                      disabled={refreshingIdx === i}
                    >
                      {refreshingIdx === i ? "다시 분석하는 중…" : "다시 분석하기"}
                    </Btn>
                  </div>
                ) : (
                  <>
                    <FbBlock label="잘한 점" accent={T.forest} items={p.strengths} />
                    <FbBlock label="개선할 점" accent={T.amber} items={p.improvements} />
                    <FbBlock label="추천 답변 방향" accent={T.sage} items={[p.suggestion]} />
                    {p.modelAnswer ? (
                      <div style={{
                        marginTop: 12, padding: "14px 16px",
                        background: "rgba(59,130,246,0.05)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: 10,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", marginBottom: 8 }}>
                          STAR 기반 모범 답안 예시 [상황/과제/행동/결과]
                        </div>
                        <p style={{
                          fontSize: 13.5, color: T.inkMid, lineHeight: 1.7,
                          whiteSpace: "pre-line", margin: 0,
                        }}>
                          {p.modelAnswer}
                        </p>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: T.inkFaint, marginTop: 12 }}>
                        {p.hasAnswer
                          ? "일시적인 서버 오류로 모범 답안을 생성하지 못했습니다. 잠시 후 다시 시도해주세요."
                          : "제출된 답변이 없어 모범 답안을 제공하지 않습니다."
                        }
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Btn variant="ghost" onClick={() => setShowRetryConfirm(true)}>
          다시 도전하기
        </Btn>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={async () => {
            if (sessionId) await completeInterview(sessionId).catch(() => { });
            navigate("/mypage");
          }}>
            <Icon.chart size={17} /> 성장 기록
          </Btn>
          <Btn variant="primary" onClick={async () => {
            if (sessionId) await completeInterview(sessionId).catch(() => { });
            navigate("/");
          }}>
            새 면접
          </Btn>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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