import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../styles/tokens";
import { SproutBadge } from "../components/Characters";
import { Field, SelectField, Btn, Eyebrow } from "../components/UI";
import { signUp, authErrorMessage } from "../auth";
import { PageTransition } from "../components/Layout";

export default function Signup() {
  const navigate = useNavigate();
  const [f, setF] = useState({ id: "", name: "", dept: "", email: "", pw: "", pw2: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ok = f.id && f.pw && f.pw === f.pw2;
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetch("https://jobcoach-backend-e0yl.onrender.com/api/departments")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data.departments || data.data || data);
      })
      .catch((err) => console.error("학과 목록 불러오기 실패:", err));
  }, []);

  const onSignup = async () => {
    if (!ok) return;
    if (f.pw.length < 8) { setErr("비밀번호는 6자 이상이어야 해요."); return; }
    setErr(""); setBusy(true);
    try {
      const result = await signUp({ studentId: f.id, password: f.pw, name: f.name, email: f.email, departmentId: f.dept });
      // 회원가입 성공 시 토큰 저장
      if (result?.token) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("studentId", result.user?.studentId || f.id);
        localStorage.setItem("userName", result.user?.name || f.name);
      }
      navigate("/");           // 가입 성공 → 자동 로그인 → 메인
    } catch (e) {
      setErr(authErrorMessage(e.message));
    } finally {
      setBusy(false);
    }
  };
  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="auth-grid">
        <div style={{
          background: T.forest, color: "#fff", padding: "56px 52px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }} className="auth-brand">
          <Eyebrow color="#A6C295">AI Interview Coach</Eyebrow>
          <div>
            <SproutBadge size={72} bg="rgba(255,255,255,0.16)" />
            <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.12, margin: "20px 0 14px" }}>
              씨앗을 심는 일,<br />지금 시작해요
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "#D6E3CC", maxWidth: 320, margin: 0 }}>
              학번 하나로 가입하고, 첫 모의 면접을 바로 시작할 수 있어요.
            </p>
          </div>
          <span style={{ fontSize: 12.5, color: "#9DB291" }}>새싹 · 2026 AI융합학부 IT경진대회</span>
        </div>
        <div style={{ display: "grid", placeItems: "center", padding: 32 }}>
          <div style={{ width: "100%", maxWidth: 360 }}>
            <Eyebrow>Create account</Eyebrow>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: T.ink, margin: "6px 0 24px" }}>회원가입</h2>
            <Field label="학번" placeholder="20201234" value={f.id} onChange={set("id")} />
            <Field label="이름" placeholder="홍길동" value={f.name} onChange={set("name")} />
            <SelectField
              label="학과"
              value={f.dept}
              onChange={set("dept")}
              options={departments.map((d) => ({ value: d.id, label: d.deptName }))}
            />
            <Field label="이메일" placeholder="20201234@sungshin.ac.kr" value={f.email} onChange={set("email")} />
            <Field label="비밀번호" type="password" placeholder="••••••••" value={f.pw} onChange={set("pw")} />
            <Field label="비밀번호 확인" type="password" placeholder="••••••••" value={f.pw2} onChange={set("pw2")} />
            {f.pw2 && f.pw !== f.pw2 && (
              <p style={{ color: "#B5503A", fontSize: 12, margin: "-6px 0 12px" }}>비밀번호가 일치하지 않아요.</p>
            )}
            {err && (
              <p style={{ color: "#B5503A", fontSize: 12.5, margin: "-6px 0 12px" }}>{err}</p>
            )}
            <Btn variant="primary" full disabled={!ok || busy} onClick={onSignup}>
              {busy ? "가입 중…" : "가입하고 시작하기"}
            </Btn>
            <p style={{ textAlign: "center", fontSize: 13.5, color: T.inkSoft, marginTop: 18 }}>
              이미 계정이 있으신가요?{" "}
              <span style={{ color: T.forest, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/login")}>로그인</span>
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