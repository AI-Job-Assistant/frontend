import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../styles/tokens";
import { Field, Btn, Eyebrow } from "../components/UI";
import { PageTransition } from "../components/Layout";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async () => {
    if (!studentId || !email) { setErr("학번과 이메일을 입력해주세요."); return; }
    setBusy(true); setErr("");
    try {
      // 추후 백엔드 API 연결
      // await fetch(`${BASE}/api/auth/password-reset`, {...})
      setSent(true);
    } catch (e) {
      setErr("비밀번호 재설정 요청에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 340 }}>
          <Eyebrow>Password Reset</Eyebrow>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, margin: "6px 0 8px" }}>
            비밀번호 찾기
          </h2>
          <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 24px" }}>
            가입 시 등록한 학번과 이메일을 입력해주세요.
          </p>

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, color: T.forest, fontWeight: 700, marginBottom: 8 }}>
                ✅ 이메일을 발송했어요!
              </p>
              <p style={{ fontSize: 13.5, color: T.inkSoft, marginBottom: 24 }}>
                이메일함을 확인해주세요.
              </p>
              <Btn variant="outline" full onClick={() => navigate("/login")}>
                로그인으로 돌아가기
              </Btn>
            </div>
          ) : (
            <>
              <Field
                label="학번" placeholder="20201234"
                value={studentId} onChange={(e) => setStudentId(e.target.value)}
              />
              <Field
                label="이메일" type="email" placeholder="20201234@sungshin.ac.kr"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
              {err && <p style={{ color: "#B5503A", fontSize: 12.5, margin: "-6px 0 12px" }}>{err}</p>}
              <Btn variant="primary" full disabled={busy} onClick={onSubmit}>
                {busy ? "전송 중…" : "비밀번호 재설정 이메일 보내기"}
              </Btn>
              <p style={{ textAlign: "center", fontSize: 13.5, color: T.inkSoft, marginTop: 20 }}>
                <span style={{ color: T.forest, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>
                  로그인으로 돌아가기
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}