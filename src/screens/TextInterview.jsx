import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, QUESTIONS } from "../styles/tokens";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar, Progress, Timer, useTimer } from "../components/Layout";
import { useApp } from "../AppContext";

export default function TextInterview() {
  const navigate = useNavigate();
  const { config } = useApp();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(5).fill(""));
  const [running, setRunning] = useState(true);
  const [sec] = useTimer(running);
  const last = idx === 4;

  const setAns = (v) => { const a = [...answers]; a[idx] = v; setAnswers(a); };
  const next = () => { if (last) { setRunning(false); navigate("/loading"); } else setIdx(idx + 1); };

  return (
    <Shell>
      <TopBar />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 18px" }}>
        <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>{config?.job} · {config?.qtype}</span>
        <Timer sec={sec} />
      </div>
      <Progress idx={idx} />

      <Card style={{ marginTop: 22, padding: 30 }}>
        <Eyebrow>Question {String(idx + 1).padStart(2, "0")}</Eyebrow>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1.45, letterSpacing: "-0.02em", margin: "10px 0 22px" }}>
          {QUESTIONS[idx]}
        </h2>
        <textarea
          value={answers[idx]}
          onChange={(e) => setAns(e.target.value)}
          placeholder="답변을 입력해주세요…"
          style={{
            width: "100%", boxSizing: "border-box", minHeight: 170, resize: "vertical",
            padding: 16, borderRadius: 11, border: `1px solid ${T.line}`,
            fontSize: 14.5, lineHeight: 1.7, background: T.bg, color: T.ink,
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = T.sage)}
          onBlur={(e) => (e.target.style.borderColor = T.line)}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <Btn variant="ghost" onClick={() => setRunning((r) => !r)}>{running ? "일시정지" : "다시 시작"}</Btn>
          <Btn variant={last ? "accent" : "primary"} onClick={next}>
            {last ? <>제출하기 <Icon.check size={18} /></> : <>다음 <Icon.arrow size={18} /></>}
          </Btn>
        </div>
      </Card>
    </Shell>
  );
}
