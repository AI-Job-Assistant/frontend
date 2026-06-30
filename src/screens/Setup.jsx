import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T, JOB_GROUPS, QTYPES, ITYPES } from "../styles/tokens";
import { Card, Chip, Btn, Section, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar } from "../components/Layout";
import { useApp } from "../AppContext";
import { createQuestions } from "../api";

export default function Setup() {
  const navigate = useNavigate();
  const { mode, setConfig, setSession, setFeedbacks, setFaceStats } = useApp();
  const [field, setField] = useState(null);  // 선택한 분야
  const [job, setJob] = useState(null);
  const [qtype, setQtype] = useState(null);
  const [itype, setItype] = useState(null);
  const [loading, setLoading] = useState(false);
  const ready = job && qtype && itype;

  // 현재 분야의 세부 직무 목록
  const jobsInField = JOB_GROUPS.find((g) => g.field === field)?.jobs || [];

  // 분야 바꾸면 이전에 고른 직무 초기화
  const onSelectField = (f) => {
    setField(f);
    setJob(null);
  };

  const onStart = async () => {
    if (loading) return;
    setLoading(true);
    setConfig({ field, job, qtype, itype });
    // 새 면접 시작이니 이전 면접 결과·표정 통계 초기화
    setFeedbacks([]);
    setFaceStats(null);
    try {
      const data = await createQuestions(job, qtype);  // API 호출 (실패 시 더미 폴백)
      setSession(data);  // { sessionId, questions[] } 보관
      navigate(mode === "speaking" ? "/interview/speak" : "/interview/text");
    } catch (e) {
      console.error("[Setup] 질문 생성 오류:", e);
      setLoading(false);
    }
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
        <Section label="Field" title="분야 선택">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {JOB_GROUPS.map((g) => (
              <Chip key={g.field} active={field === g.field} onClick={() => onSelectField(g.field)}>
                {g.field}
              </Chip>
            ))}
          </div>
        </Section>

        {field && (
          <Section label="Role" title="직무 선택">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              {jobsInField.map((j) => (
                <Chip key={j} active={job === j} onClick={() => setJob(j)}>{j}</Chip>
              ))}
            </div>
          </Section>
        )}

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
            {ready ? `${job} · ${qtype} · ${itype}` : "분야 · 직무 · 질문 유형을 선택해주세요"}
          </span>
          <Btn variant="accent" disabled={!ready || loading} onClick={onStart} style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
            {loading ? "질문 준비 중…" : <>면접 시작 <Icon.arrow size={18} /></>}
          </Btn>
        </div>
      </Card>
    </Shell>
  );
}