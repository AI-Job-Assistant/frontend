import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, JOBS, QTYPES, ITYPES } from "../styles/tokens";
import { Card, Chip, Btn, Section, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";

export default function Setup() {
  const navigate = useNavigate();
  const { mode, setConfig } = useApp();
  const [job, setJob] = useState(null);
  const [qtype, setQtype] = useState(null);
  const [itype, setItype] = useState(null);
  const ready = job && qtype && itype;
  const onStart = () => {
    setConfig({ job, qtype, itype });
    navigate(mode === "speaking" ? "/interview/speak" : "/interview/text");
  };

  return (
    <Shell>
      <TopBar />

      <div style={{ margin: "24px 0 24px" }}>
        <Eyebrow>{mode === "speaking" ? "Speaking interview" : "Text interview"} · Setup</Eyebrow>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: T.ink, margin: "8px 0 4px" }}>면접 설정</h1>
        <p style={{ fontSize: 14, color: T.inkSoft, margin: 0 }}>선택한 항목은 주황색으로 표시돼요.</p>
      </div>

      <Card style={{ padding: 28 }}>
        <Section label="Role" title="직무 선택">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {JOBS.map((j) => <Chip key={j} active={job === j} onClick={() => setJob(j)}>{j}</Chip>)}
          </div>
        </Section>

        <Section label="Question type" title="질문 유형">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {QTYPES.map((q) => <Chip key={q} active={qtype === q} onClick={() => setQtype(q)}>{q}</Chip>)}
          </div>
        </Section>

        <Section label="Style" title="면접 유형">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {ITYPES.map((i) => <Chip key={i} active={itype === i} onClick={() => setItype(i)}>{i}</Chip>)}
          </div>
        </Section>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 14,
          marginTop: 26, paddingTop: 20, borderTop: `1px solid ${T.line}`,
        }}>
          <span style={{
            fontSize: 13, color: ready ? T.inkMid : T.inkSoft, fontWeight: ready ? 600 : 400,
            flex: "1 1 200px", minWidth: 0,
          }}>
            {ready ? `${job} · ${qtype} · ${itype}` : "직무와 질문 유형을 선택해주세요"}
          </span>
          <Btn variant="accent" disabled={!ready} onClick={onStart} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            면접 시작 <Icon.arrow size={18} />
          </Btn>
        </div>
      </Card>
    </Shell>
  );
}