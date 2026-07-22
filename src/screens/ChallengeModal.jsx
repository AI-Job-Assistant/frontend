import React, { useState } from "react";
import { T, JOB_GROUPS, QTYPES, QTYPE_MAP } from "../styles/tokens";
import { Btn, Chip, Eyebrow, Card } from "../components/UI";
import { Sprout } from "../components/Characters";
import { createQuestions, evaluateAnswer } from "../api";

/* 단계: select → loading → question → result */
export default function ChallengeModal({ onClose }) {
  const [step, setStep] = useState("select"); // select | loading | question | result
  const [field, setField] = useState(null);
  const [job, setJob] = useState(null);
  const [qtype, setQtype] = useState(null);
  const [question, setQuestion] = useState(null); // { id, content }
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [err, setErr] = useState("");
  const [loadingText, setLoadingText] = useState("질문을 준비하고 있어요");

  const jobsInField = JOB_GROUPS.find((g) => g.field === field)?.jobs || [];
  const ready = job && qtype;

  /* 질문 생성 */
  const onStart = async () => {
    if (!ready) return;
    setLoadingText("질문을 준비하고 있어요");
    setStep("loading");
    setErr("");
    try {
      const data = await createQuestions(job, qtype);
      // 질문 5개 중 랜덤 1개 선택
      const idx = Math.floor(Math.random() * data.questions.length);
      setQuestion(data.questions[idx]);
      setAnswer("");
      setFeedback(null);
      setStep("question");
    } catch (e) {
      setErr("질문 생성에 실패했어요. 다시 시도해주세요.");
      setStep("select");
    }
  };

  /* 답변 제출 */
  const onSubmit = async () => {
    if (!answer.trim()) { setErr("답변을 입력해주세요."); return; }
    setLoadingText("답변을 살펴보고 있어요");
    setStep("loading");
    setErr("");
    try {
      const result = await evaluateAnswer({
        questionId: null,
        question: question.content,
        answer,
        questionType: QTYPE_MAP[qtype] || qtype,
      });
      setFeedback(result);
      setStep("result");
    } catch (e) {
      setErr("피드백 생성에 실패했어요. 다시 시도해주세요.");
      setStep("question");
    }
  };

  /* 한 번 더 */
  const onRetry = () => {
    setAnswer("");
    setFeedback(null);
    onStart();
  };

  return (
    /* 배경 오버레이 */
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)",
      display: "grid", placeItems: "center", padding: 24,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: T.surface, borderRadius: 20, padding: 32,
        width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
      }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <Eyebrow>Challenge</Eyebrow>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.ink, margin: "4px 0 0", letterSpacing: "-0.02em" }}>
              도전 모드
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 20, color: T.inkSoft, padding: 4,
          }}>✕</button>
        </div>

        {/* 에러 */}
        {err && <p style={{ color: "#B5503A", fontSize: 13, marginBottom: 12 }}>{err}</p>}

        {/* 단계 1: 직무/유형 선택 */}
        {step === "select" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.inkMid, marginBottom: 8 }}>분야 선택</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {JOB_GROUPS.map((g) => (
                  <Chip key={g.field} active={field === g.field} onClick={() => { setField(g.field); setJob(null); }}>
                    {g.field}
                  </Chip>
                ))}
              </div>
            </div>

            {field && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.inkMid, marginBottom: 8 }}>직무 선택</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {jobsInField.map((j) => (
                    <Chip key={j} active={job === j} onClick={() => setJob(j)}>{j}</Chip>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.inkMid, marginBottom: 8 }}>질문 유형</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {QTYPES.map((q) => (
                  <Chip key={q} active={qtype === q} onClick={() => setQtype(q)}>{q}</Chip>
                ))}
              </div>
            </div>

            <Btn variant="accent" full disabled={!ready} onClick={onStart}>
              질문 받기
            </Btn>
          </div>
        )}

        {/* 단계 2: 로딩 */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="sprout-grow"><Sprout size={56} /></div>
            <p style={{ fontSize: 14.5, color: T.inkSoft, marginTop: 16, fontWeight: 600 }}>{loadingText}</p>
          </div>
        )}

        {/* 단계 3: 질문 + 답변 입력 */}
        {step === "question" && question && (
          <div>
            <Card style={{ padding: 20, marginBottom: 16, background: T.mist, border: "none" }}>
              <Eyebrow>Question</Eyebrow>
              <p style={{ fontSize: 16, fontWeight: 700, color: T.ink, lineHeight: 1.5, margin: "8px 0 0", textIndent: "1em" }}>
                {question.content}
              </p>
            </Card>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="답변을 입력해주세요."
              style={{
                width: "100%", boxSizing: "border-box", minHeight: 140,
                padding: 14, borderRadius: 11, border: `1px solid ${T.line}`,
                fontSize: 14.5, lineHeight: 1.7, background: T.bg, color: T.ink,
                outline: "none", fontFamily: "inherit", resize: "vertical",
              }}
              onFocus={(e) => (e.target.style.borderColor = T.sage)}
              onBlur={(e) => (e.target.style.borderColor = T.line)}
            />
            <div style={{ textAlign: "right", fontSize: 12, color: T.inkFaint, marginTop: 4, marginBottom: 16 }}>
              {answer.length}자
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="outline" full onClick={onClose}>끝내기</Btn>
              <Btn variant="primary" full onClick={onSubmit}>제출하기</Btn>
            </div>
          </div>
        )}

        {/* 단계 4: 피드백 결과 */}
        {step === "result" && feedback && (
          <div>
            {/* 점수 */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Eyebrow>Score</Eyebrow>
              <div style={{ fontSize: 56, fontWeight: 800, color: T.forest, letterSpacing: "-0.04em", lineHeight: 1 }}>
                {feedback.score}
              </div>
              <div style={{ fontSize: 13, color: T.inkSoft }}>100점 만점</div>
            </div>

            {/* 질문 */}
            <Card style={{ padding: 16, marginBottom: 12, background: T.mist, border: "none" }}>
              <Eyebrow>Question</Eyebrow>
              <p style={{ fontSize: 14, color: T.ink, margin: "6px 0 0", lineHeight: 1.5 }}>{question.content}</p>
            </Card>

            {/* 피드백 */}
            <FbRow label="잘한 점" accent={T.forest} items={feedback.strengths} />
            <FbRow label="개선할 점" accent={T.amber} items={feedback.improvements} />
            <FbRow label="추천 방향" accent={T.sage} items={[feedback.suggestion]} />

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="outline" full onClick={onClose}>끝내기</Btn>
              <Btn variant="accent" full onClick={onRetry}>다시하기</Btn>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .sprout-grow { animation: sproutGrow 1.6s ease-in-out infinite; transform-origin: bottom; display: inline-block; }
        @keyframes sproutGrow { 0%,100%{ transform: scale(.96) } 50%{ transform: scale(1.04) } }
        @media (prefers-reduced-motion: reduce){ .sprout-grow{ animation: none } }
      `}</style>
    </div>
  );
}

function FbRow({ label, accent, items }) {
  const list = (items || []).filter(Boolean);
  if (list.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: `1px solid ${T.line}` }}>
      <div style={{ flex: "0 0 3px", borderRadius: 3, background: accent, alignSelf: "stretch" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: accent, marginBottom: 4 }}>{label}</div>
        {list.map((t, i) => (
          <div key={i} style={{ fontSize: 13.5, color: T.inkMid, lineHeight: 1.6 }}>· {t}</div>
        ))}
      </div>
    </div>
  );
}