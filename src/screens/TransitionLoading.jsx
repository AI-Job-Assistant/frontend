import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { T } from "../styles/tokens";
import { Sprout } from "../components/Characters";
import { Centered } from "../components/Layout";
import { motion } from 'framer-motion';
import beeIcon from '../assets/beeIcon.png';

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
      <div style={{ position: "relative", height: 140, width: 280, margin: "0 auto" }}>
        <motion.img
          src={beeIcon}
          alt="bee"
          style={{ width: 28, height: 28, position: "absolute", top: -10, left: 110 }}
          animate={{
            x: [0, 10, 20, 30, 40, 50, 60, 70, 80],
            y: [15, -15, 15, -15, 15, -15, 15, -15, 15],
            rotate: [-30, 30, -30, 30, -30, 30, -30, 30, -30],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
          }}
        />
        <div className="sprout-grow" style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)" }}>
          <Sprout size={84} />
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