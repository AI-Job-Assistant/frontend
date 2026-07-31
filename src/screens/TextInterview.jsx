import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T, QUESTIONS } from "../styles/tokens";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar, Progress, Timer, useTimer, ConfirmModal, useCountdown } from "../components/Layout";
import { useApp } from "../AppContext";

export default function TextInterview() {
  const navigate = useNavigate();
  const { config, session, setAnswers: setSessionAnswers, setTotalSec } = useApp();

  const qList = session?.questions || QUESTIONS.map((content, i) => ({ id: null, content }));
  const questions = qList.map((q) => q.content);
  const total = questions.length;

  const isPressure = config?.itype === "압박 면접";

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
  const [showPressureGuide, setShowPressureGuide] = useState(isPressure);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [extraCount, setExtraCount] = useState(Array(total).fill(0));
  const [totalPenalty, setTotalPenalty] = useState(0);

  const last = idx === total - 1;

  const { sec: cdSec, start: cdStart } = useCountdown(120, () => {
    if (isPressure) setShowTimeUp(true);
  });

  useEffect(() => {
    if (isPressure && !showPressureGuide) cdStart(120);
  }, [idx]);

  const setAns = (v) => {
    const a = [...answers];
    a[idx] = v;
    setAnswers(a);
    localStorage.setItem("draft_answers", JSON.stringify(a));
  };

  const submit = () => {
    const payload = qList.map((q, i) => ({
      questionId: q.id,
      question: q.content,
      answer: answers[i] || "",
    }));
    setSessionAnswers(payload);
    setTotalSec(sec);
    sessionStorage.setItem("penalty", totalPenalty);
    localStorage.removeItem("draft_answers");
    setRunning(false);
    navigate("/loading");
  };

  const next = () => {
    if (last) submit();
    else setIdx(idx + 1);
  };

  const onTimeUpConfirm = () => {
    setShowTimeUp(false);
    if (extraCount[idx] < 2) {
      const newCount = [...extraCount];
      newCount[idx] += 1;
      setExtraCount(newCount);
      setTotalPenalty((p) => p + 1);
      cdStart(30);
    } else {
      next();
    }
  };

  const timeUpDesc = extraCount[idx] >= 2
    ? "이미 2번 추가했어요. 다음 문제로 넘어갈게요."
    : "30초를 추가할 수 있어요. (" + extraCount[idx] + "/2회)\n추가 시 3점이 감점돼요.";

  const timeUpConfirmText = extraCount[idx] >= 2 ? "다음 문제로" : "30초 추가";
  const timeUpCancelText = extraCount[idx] >= 2 ? "" : "다음 문제로";

  return (
    <Shell>
      <TopBar onQuit={() => setShowQuit(true)} />

      <ConfirmModal
        open={showPressureGuide}
        title="압박 면접 안내"
        desc="각 질문당 2분 제한이 있어요. 30초 추가는 문제당 최대 2번 가능하며, 추가 1회당 최종 점수에서 3점 감점돼요."
        onConfirm={() => { setShowPressureGuide(false); cdStart(120); }}
        onCancel={() => navigate("/")}
        confirmText="시작하기"
        cancelText="돌아가기"
      />

      <ConfirmModal
        open={showQuit}
        title="면접을 중단할까요?"
        desc="지금 나가면 진행 중인 답변이 저장되지 않아요."
        onConfirm={() => { localStorage.removeItem("draft_answers"); navigate("/"); }}
        onCancel={() => setShowQuit(false)}
        confirmText="나가기"
        cancelText="계속 진행"
      />

      <ConfirmModal
        open={showTimeUp}
        title="시간이 초과됐어요!"
        desc={timeUpDesc}
        onConfirm={onTimeUpConfirm}
        onCancel={() => { setShowTimeUp(false); next(); }}
        confirmText={timeUpConfirmText}
        cancelText={timeUpCancelText}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 18px" }}>
        <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>{config?.job} · {config?.qtype}</span>
        {isPressure ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 700,
            color: cdSec <= 30 ? "#B5503A" : T.inkMid, letterSpacing: "0.02em",
            }}>
            <Icon.clock size={15} />
            {String(Math.floor(cdSec / 60)).padStart(2, "0")}:{String(cdSec % 60).padStart(2, "0")}
          </span>
        ) : (
          <Timer sec={sec} />
        )}
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
            padding: 16, borderRadius: 11, border: "1px solid " + T.line,
            fontSize: 14.5, lineHeight: 1.7, background: T.bg, color: T.ink,
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={(e) => (e.target.style.borderColor = T.sage)}
          onBlur={(e) => (e.target.style.borderColor = T.line)}
        />
        <div style={{ textAlign: "right", fontSize: 12, color: T.inkFaint, marginTop: 6 }}>
          {answers[idx].length}자
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 18 }}>
          <Btn variant={last ? "accent" : "primary"} onClick={next}>
            {last ? "제출하기" : "다음"}
          </Btn>
        </div>
      </Card>
    </Shell>
  );
}