import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T, QUESTIONS } from "../styles/tokens";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar, Progress, Timer, useTimer } from "../components/Layout";
import { useApp } from "../AppContext";
import { useFaceAnalysis } from "../components/useFaceAnalysis";

/* 브라우저 음성 인식 지원 여부 */
const SR = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export default function SpeakInterview() {
  const navigate = useNavigate();
  const { config, session, setFaceStats, setAnswers: setSessionAnswers } = useApp();

  // 받아온 질문 (없으면 더미 폴백)
  const qList = session?.questions || QUESTIONS.map((content, i) => ({ id: null, content }));
  const questions = qList.map((q) => q.content);
  const total = questions.length;

  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(Array(total).fill(false));
  const [texts, setTexts] = useState(Array(total).fill(""));
  const [interim, setInterim] = useState("");
  const [camReady, setCamReady] = useState(false);
  const [error, setError] = useState("");
  const [sec, reset] = useTimer(recording);
  const last = idx === total - 1;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recogRef = useRef(null);
  const finalRef = useRef("");
  const camIdRef = useRef(null);

  // 얼굴 분석 — recording 동안만 동작 (videoRef·recording 선언 이후에 위치해야 함)
  const { stats: faceStats, resetStats } = useFaceAnalysis(videoRef, recording);

  const startCamera = async () => {
    if (streamRef.current) { console.log("[cam] 이미 켜짐"); return; }
    try {
      // 진짜 웹캠 deviceId를 아직 못 찾았으면 한 번만 탐색
      if (!camIdRef.current) {
        const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        probe.getTracks().forEach((t) => t.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === "videoinput");
        console.log("[cam] 카메라 목록:", cams.map((c) => c.label));
        const real = cams.find((c) => !/virtual|mirametrix|obs|snap/i.test(c.label)) || cams[0];
        camIdRef.current = real?.deviceId || null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: camIdRef.current ? { deviceId: { exact: camIdRef.current } } : true,
        audio: false,
      });

      console.log("[cam] 사용 카메라:", stream.getVideoTracks()[0]?.label);
      streamRef.current = stream;
      setCamReady(true);
      attachStream();
    } catch (e) {
      console.log("[cam] 실패:", e.name, e.message);
      setError(`카메라를 켤 수 없어요: ${e.name}`);
    }
  };

  /* video 요소에 스트림 붙이기 (여러 번 불려도 안전) */
  const attachStream = () => {
    const v = videoRef.current;
    const s = streamRef.current;
    if (!v || !s) { console.log("[cam] attach 보류 - video:", !!v, "stream:", !!s); return; }
    if (v.srcObject !== s) {
      v.srcObject = s;
      console.log("[cam] srcObject 연결됨");
    }
    v.play().then(() => console.log("[cam] 재생 성공")).catch((err) => console.log("[cam] 재생 실패:", err.name));
  };

  /* 카메라 끄기 */
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamReady(false);
  };

  /* camReady·리렌더 후 재연결 보장 */
  useEffect(() => {
    if (camReady) attachStream();
  }, [camReady, idx, recording]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => { resetStats(); }, []);

  /* 음성 인식기 */
  const buildRecognizer = () => {
    if (!SR) return null;
    const r = new SR();
    r.lang = "ko-KR";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += tr;
        else live += tr;
      }
      setInterim(live);
      setTexts((prev) => { const a = [...prev]; a[idx] = finalRef.current; return a; });
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("마이크 권한을 허용해주세요.");
      else if (e.error === "no-speech") setError("음성이 감지되지 않았어요. 다시 시도해주세요.");
    };
    r.onend = () => { if (recogRef.current?._active) { try { r.start(); } catch {} } };
    return r;
  };

  const start = async () => {
    setError("");
    if (!SR) { setError("이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요."); return; }
    setRecording(true);
    await startCamera();
    finalRef.current = texts[idx] || "";
    const r = buildRecognizer();
    if (!r) return;
    r._active = true;
    recogRef.current = r;
    try { r.start(); } catch {}
  };

  const stop = () => {
    if (recogRef.current) { recogRef.current._active = false; try { recogRef.current.stop(); } catch {} }
    stopCamera();
    setRecording(false);
    setInterim("");
    // 세션 누적값을 전역에 갱신 (질문마다 갱신해도 누적이라 계속 커짐)
    setFaceStats(faceStats);
    const r = [...recorded]; r[idx] = true; setRecorded(r);
  };

  const retake = () => {
    if (recogRef.current) { recogRef.current._active = false; try { recogRef.current.stop(); } catch {} }
    stopCamera();
    finalRef.current = "";
    setRecording(false);
    setInterim("");
    setTexts((prev) => { const a = [...prev]; a[idx] = ""; return a; });
    setRecorded((prev) => { const a = [...prev]; a[idx] = false; return a; });
    reset();
  };

  const next = () => {
    if (recogRef.current) { recogRef.current._active = false; try { recogRef.current.stop(); } catch {} }
    stopCamera();
    if (last) {
      setFaceStats(faceStats);  // 최종 누적 확정
      // 답변 묶음 전역 저장 (질문 id·내용과 함께)
      setSessionAnswers(
        qList.map((q, i) => ({
          questionId: q.id,
          question: q.content,
          answer: texts[i] || "",
        }))
      );
      navigate("/loading");
    } else {
      setIdx(idx + 1); reset(); setRecording(false); setInterim(""); finalRef.current = "";
    }
  };

  const shown = (texts[idx] + " " + interim).trim();

  return (
    <Shell>
      <TopBar />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 18px" }}>
        <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>{config?.job} · {config?.qtype}</span>
        <Timer sec={sec} />
      </div>
      <Progress idx={idx} />

      <Card style={{ marginTop: 22, padding: 30, textAlign: "center" }}>
        <Eyebrow>Question {String(idx + 1).padStart(2, "0")}</Eyebrow>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1.45, letterSpacing: "-0.02em", margin: "10px 0 26px" }}>
          {questions[idx]}
        </h2>

        {/* 카메라 프리뷰 — video는 항상 렌더, placeholder는 위에 겹쳐서 표시 */}
        <div style={{
          position: "relative", margin: "0 auto 18px", width: "100%", maxWidth: 380, aspectRatio: "16/9",
          borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.line}`,
          overflow: "hidden", color: T.inkFaint,
        }}>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", transform: "scaleX(-1)",
              opacity: camReady ? 1 : 0, transition: "opacity .3s",
            }}
          />
          {!camReady && (
            <div style={{
              position: "absolute", inset: 0, display: "grid", placeItems: "center",
              gap: 6, gridAutoFlow: "row", zIndex: 1,
            }}>
              <Icon.cam size={28} />
              <span style={{ fontSize: 12.5 }}>카메라 · 마이크 미리보기</span>
            </div>
          )}
          {recording && (
            <span style={{
              position: "absolute", top: 10, left: 10, zIndex: 2,
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 9px", borderRadius: 20, background: "rgba(181,80,58,.92)",
              color: "#fff", fontSize: 11.5, fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} /> REC
            </span>
          )}
          {/* 실시간 표정·응시 통계 */}
          {recording && (
            <span style={{
              position: "absolute", top: 10, right: 10, zIndex: 2,
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,.45)",
              color: "#fff", fontSize: 11, fontWeight: 600,
            }}>
              <span>😊 웃음 {faceStats.smiles}</span>
              <span>👁 응시 {faceStats.gazeRate}%</span>
            </span>
          )}
        </div>

        {/* 녹음 버튼 */}
        <button
          onClick={recording ? stop : start}
          style={{
            width: 68, height: 68, borderRadius: "50%", border: "none", cursor: "pointer",
            background: recording ? "#B5503A" : T.forest, color: "#fff",
            display: "grid", placeItems: "center",
            boxShadow: recording ? `0 0 0 6px ${T.amberSoft}` : "none",
            transition: "all .2s",
          }}
          aria-label={recording ? "녹음 중지" : "녹음 시작"}
        >
          {recording ? <Icon.stop size={26} /> : <Icon.mic size={26} />}
        </button>
        <p style={{ fontSize: 13, color: T.inkSoft, margin: "12px 0 0" }}>
          {recording ? "녹음 중 · 다시 누르면 중지" : recorded[idx] ? "답변이 녹음되었어요" : "버튼을 눌러 답변을 시작하세요"}
        </p>

        {error && (
          <p style={{ fontSize: 12.5, color: "#B5503A", margin: "10px 0 0", fontWeight: 600 }}>{error}</p>
        )}

        {/* 인식된 한글 텍스트 — 수정 가능 */}
        {(texts[idx] || interim || recording || recorded[idx]) && (
          <div style={{
            marginTop: 18, padding: 16, borderRadius: 11,
            background: T.bg, border: `1px solid ${T.line}`,
            textAlign: "left",
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7,
            }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, letterSpacing: "0.02em" }}>
                인식된 답변
              </span>
              <span style={{ fontSize: 11, color: T.inkFaint }}>직접 수정할 수 있어요</span>
            </div>

            <textarea
              value={texts[idx]}
              onChange={(e) => {
                const v = e.target.value;
                finalRef.current = v;   // 누적 기준값도 같이 갱신해야 다시 녹음 시 이어쓰기됨
                setTexts((prev) => { const a = [...prev]; a[idx] = v; return a; });
              }}
              placeholder="여기에 음성 인식 결과가 누적돼요. 직접 입력·수정도 가능해요."
              style={{
                width: "100%", minHeight: 96, padding: 12,
                borderRadius: 8, border: `1px solid ${T.line}`, background: T.surface,
                fontSize: 14.5, lineHeight: 1.7, color: T.ink, resize: "vertical",
                fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />

            {/* 녹음 중 인식되고 있는 임시 텍스트 (확정 전) */}
            {recording && interim && (
              <p style={{ fontSize: 13, color: T.inkSoft, margin: "8px 2px 0", fontStyle: "italic" }}>
                … {interim}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
          <Btn variant="outline" onClick={retake}>다시 녹음</Btn>
          <Btn variant={last ? "accent" : "primary"} disabled={!recorded[idx]} onClick={next}>
            {last ? <>제출하기 <Icon.check size={18} /></> : <>다음 <Icon.arrow size={18} /></>}
          </Btn>
        </div>
      </Card>
    </Shell>
  );
}