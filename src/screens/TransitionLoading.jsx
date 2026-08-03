import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { T } from "../styles/tokens";
import { Sprout } from "../components/Characters";
import { Centered } from "../components/Layout";

export default function TransitionLoading() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message = "꿈을 향한 한 걸음", to = "/", replace = true } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(to, { replace });
    }, 1100); // 노출 시간 — 원하면 조절
    return () => clearTimeout(timer);
  }, []);

  return (
    <Centered>
      <div style={{ textAlign: "center", position: "relative" }}>
        <div className="sprout-grow">
          <Sprout size={84} />
        </div>
        <div style={{
          position: "absolute", top: "100%", left: "50%",
          transform: "translateX(-50%)", width: 260,
          marginTop: 22,
        }}>
          <p style={{ fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: "-0.01em", margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
      <style>{`
        .sprout-grow { animation: grow 1.6s ease-in-out infinite; transform-origin: bottom; }
        @keyframes grow { 0%,100%{ transform: scale(.96) } 50%{ transform: scale(1.04) } }
        @media (prefers-reduced-motion: reduce){
          .sprout-grow{ animation: none }
        }
      `}</style>
    </Centered>
  );
}