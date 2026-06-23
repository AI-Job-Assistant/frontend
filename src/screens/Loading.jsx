import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../styles/tokens";
import { Sprout } from "../components/Characters";
import { Centered } from "../components/Layout";

export default function Loading() {
  const navigate = useNavigate();
  useEffect(() => {
    // 채점 API 응답을 기다리는 자리 (지금은 더미 딜레이)
    const t = setTimeout(() => navigate("/result", { replace: true }), 1900);
    return () => clearTimeout(t);
  }, [navigate]);

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
