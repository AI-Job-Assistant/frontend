import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, QUESTIONS } from "../styles/tokens";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar, Progress, Timer, useTimer, ConfirmModal } from "../components/Layout";
import { useApp } from "../AppContext";

export default function TextInterview() {
  const navigate = useNavigate();
  const { config, session, setAnswers: setSessionAnswers, setTotalSec } = useApp();

  const qList = session?.questions || QUESTIONS.map((content, i) => ({ id: null, content }));
  const questions = qList.map((q) => q.content);
  const total = questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("draft_answers");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === total) return parsed;
      } catch {}
    }
    return Array(total).fill("");
  });
  const [running, setRunning] = useState(true);
  const [sec] = useTimer(running);
  const [showQuit, setShowQuit] = useState(false);
  const last = idx === total - 1;

  const setAns = (v) => {
    const a = [...answers];
    a[idx] = v;
    setAnswers(a);
    localStorage.setItem("draft_answers", JSON.stringify(a));
  };

  const submit = () => {
    // 화면 로컬 답변 → 전역으로 (질문 id·내용과 묶어서)
    const payload = qList.map((q, i) => ({
      questionId: q.id,
      question: q.content,
      answer: answers[i] || "",
    }));
    setSessionAnswers(payload);
    setTotalSec(sec);
    setRunning(false);
    localStorage.removeItem("draft_answers");
    navigate("/loading");
    navigate("/loading");
  };

  const next = () => { if (last) submit(); else setIdx(idx + 1); };
  return (
    <Shell>
      <TopBar onQuit={() => setShowQuit(true)} />
      <ConfirmModal
      open={showQuit}
      title="면접을 중단할까요?"
      desc="지금 나가면 진행 중인 답변이 저장되지 않아요."
      onConfirm={() => navigate("/")}
      onCancel={() => setShowQuit(false)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 18px" }}>
        <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>{config?.job} · {config?.qtype}</span>
        <Timer sec={sec} />
      </div>
      
      <Progress idx={idx} />

      <Card style={{ marginTop: 22, padding: 30 }}>
        <Eyebrow>Question {String(idx + 1).padStart(2, "0")}</Eyebrow>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1.45, letterSpacing: "-0.02em", margin: "10px 0 22px" }}>
          {questions[idx]}
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
        {/* 글자 수 카운터 */}
        <div style={{ textAlign: "right", fontSize: 12, color: T.inkFaint, marginTop: 6 }}>
          {answers[idx].length}자
        </div>
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
