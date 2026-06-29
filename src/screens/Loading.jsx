import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { T, QTYPE_MAP } from "../styles/tokens";
import { evaluateAnswer } from "../api";
import { Sprout } from "../components/Characters";
import { Centered } from "../components/Layout";
import { useApp } from "../AppContext";

export default function Loading() {
  const navigate = useNavigate();
  const { mode, config, session, answers, faceStats, setFeedbacks } = useApp();
  const ranRef = useRef(false);  // StrictMode 이중 실행 방지

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      // 답변이 없으면(직접 진입 등) 더미로 빠지게 그냥 결과로
      if (!answers || answers.length === 0) {
        navigate("/result", { replace: true });
        return;
      }

      // 화면 표기 → 명세서 Enum (없으면 그대로)
      const questionType = QTYPE_MAP[config?.qtype] || config?.qtype;

      // 스피킹만 카메라 지표 첨부 (gazeRate 0~100 → 0~1 변환)
      const extra =
        mode === "speaking" && session?.sessionId != null
          ? {
              sessionId: session.sessionId,
              smileCount: faceStats?.smiles ?? 0,
              eyeContactRatio: (faceStats?.gazeRate ?? 0) / 100,
            }
          : undefined;

      try {
        const results = await Promise.all(
          answers.map((a) =>
            evaluateAnswer({
              questionId: a.questionId,
              question: a.question,
              answer: a.answer,
              questionType,
              extra,
            })
          )
        );
        setFeedbacks(results);
      } catch (e) {
        // evaluateAnswer 내부에서 이미 더미 폴백하므로 여기 거의 안 옴
        console.warn("[loading] 채점 실패:", e.message);
        setFeedbacks([]);
      }
      navigate("/result", { replace: true });
    })();
  }, []);  // 마운트 시 1회

  return (
    <Centered>
      <div style={{ textAlign: "center" }}>
        <div className="sprout-grow"><Sprout size={84} /></div>
        <p style={{ marginTop: 22, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em" }}>
          답변을 살펴보는 중
        </p>
        <p style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>AI가 피드백과 점수를 정리하고 있어요</p>
        <div style={{ width: 160, height: 3, background: T.line, borderRadius: 2, margin: "20px auto 0", overflow: "hidden" }}>
          <div className="bar" style={{ height: "100%", background: T.forest, borderRadius: 2 }} />
        </div>
      </div>
      <style>{`
        .sprout-grow { animation: grow 1.6s ease-in-out infinite; transform-origin: bottom; }
        @keyframes grow { 0%,100%{ transform: scale(.96) } 50%{ transform: scale(1.04) } }
        .bar { width: 40%; animation: slide 1.3s ease-in-out infinite; }
        @keyframes slide { 0%{ margin-left: -40% } 100%{ margin-left: 100% } }
        @media (prefers-reduced-motion: reduce){
          .sprout-grow,.bar{ animation: none } .bar{ width:100% }
        }
      `}</style>
    </Centered>
  );
}
