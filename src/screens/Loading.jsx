import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, QTYPE_MAP } from "../styles/tokens";
import { evaluateAnswer , completeInterview} from "../api";
import { Sprout } from "../components/Characters";
import { Centered } from "../components/Layout";
import { Btn } from "../components/UI";
import { useApp } from "../AppContext";

export default function Loading() {
  const navigate = useNavigate();
  const { mode, config, session, answers, faceStats, setFeedbacks } = useApp();
  const ranRef = useRef(false);  // StrictMode 이중 실행 방지
  const [error, setError] = useState(false);

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
        const results = [];
        for (const a of answers) {
          const result = await evaluateAnswer({
            questionId: a.questionId,
            question: a.question,
            answer: a.answer,
            questionType,
            extra,
          });
          results.push(result);
        }
        setFeedbacks(results);
      } catch (e) {
        console.warn("[loading] 채점 실패:", e.message);
        setError(true);
        ranRef.current = false; // 다시 시도 가능하게
        return; // 결과 화면으로 안 넘어가게
      }
      
      navigate("/result", { replace: true });
    })();
  }, []);  // 마운트 시 1회

  return (
    <Centered>
      {error && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#B5503A", marginBottom: 8 }}>
            AI 응답에 실패했어요
          </p>
          <p style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 20 }}>
            네트워크 상태를 확인하고 다시 시도해주세요.
          </p>
          <Btn variant="primary" onClick={() => { setError(false); ranRef.current = false; }}>
            다시 시도하기
          </Btn>
        </div>
      )}
      {!error && (
        <div style={{ textAlign: "center", position: "relative" }}>
          {/* 새싹 = 화면 정중앙에 고정. 아래 텍스트는 절대 위치로 새싹 밑에 배치 */}
          <div className="sprout-grow">
            <Sprout size={84} />
          </div>
          <div style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)", width: 260,
            marginTop: 22,
          }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em", margin: 0 }}>
              답변을 살펴보는 중
            </p>
            <p style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4 }}>AI가 피드백과 점수를 정리하고 있어요</p>
            <div style={{ width: 160, height: 3, background: T.line, borderRadius: 2, margin: "20px auto 0", overflow: "hidden" }}>
              <div className="bar" style={{ height: "100%", background: T.forest, borderRadius: 2 }} />
            </div>
          </div>
        </div>
      )}
      
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
