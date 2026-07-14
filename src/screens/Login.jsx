import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../styles/tokens";
import { SproutBadge } from "../components/Characters";
import { Field, Btn, Eyebrow } from "../components/UI";
import { signIn, authErrorMessage } from "../auth";
import { useApp } from "../AppContext";
import { Shell, TopBar } from "../components/Layout";
import { PageTransition } from "../components/Layout";

export default function Login() {
  const navigate = useNavigate();
  const { setStudentId: _set, user: _u } = useApp(); // authReady 대기 불필요
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (!id || !pw) { setErr("학번과 비밀번호를 입력해주세요."); return; }
    setErr(""); setBusy(true);
    try {
      await signIn({ studentId: id, password: pw });
      navigate("/");           // 로그인 성공 → 메인
    } catch (e) {
      // Firebase는 e.code, MySQL은 e.message로 에러가 옴
      setErr(authErrorMessage(e.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="auth-grid">
        {/* 좌: 브랜드 패널 */}
        <div style={{
          background: T.forest, color: "#fff", padding: "56px 52px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          position: "relative", overflow: "hidden",
        }} className="auth-brand">
          <Eyebrow color="#A6C295">AI Interview Coach</Eyebrow>
          <div>
            <SproutBadge size={72} bg="rgba(255,255,255,0.16)" />
            <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "20px 0 14px" }}>
              매일 한 뼘씩<br />자라는 면접 실력
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "#D6E3CC", margin: 0 }}>
              직무 맞춤 질문에 답하고, AI 피드백으로 강점과 보완점을 쌓아가요.<br />
              연습이 기록이 되고, 기록이 성장이 됩니다.
            </p>
          </div>
          <span />
        </div>
        {/* 우: 폼 */}
        <div style={{ display: "grid", placeItems: "center", padding: 32 }}>
          <div style={{ width: "100%", maxWidth: 340 }}>
            <Eyebrow>Sign in</Eyebrow>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, margin: "6px 0 26px" }}>로그인</h2>
            <Field label="학번" placeholder="20201234" value={id} onChange={(e) => setId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onLogin()} />
            <Field label="비밀번호" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onLogin()} />
            {err && (
              <p style={{ color: "#B5503A", fontSize: 12.5, margin: "-6px 0 12px" }}>{err}</p>
            )}
            <Btn variant="primary" full style={{ marginTop: 6 }} disabled={busy} onClick={onLogin}>
              {busy ? "로그인 중…" : "로그인"}
            </Btn>
            <p style={{ textAlign: "center", fontSize: 13.5, color: T.inkSoft, marginTop: 20 }}>
              아직 계정이 없으신가요?{" "}
              <span style={{ color: T.forest, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/signup")}>회원가입</span>
            </p>
          </div>
        </div>
        <style>{`
          @media (max-width: 720px) {
            .auth-grid { grid-template-columns: 1fr !important; }
            .auth-brand { display: none !important; }
          }
        `}</style>
      </div>
    </PageTransition>
  );
}
