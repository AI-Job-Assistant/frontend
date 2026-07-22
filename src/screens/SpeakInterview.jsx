import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T, QUESTIONS } from "../styles/tokens";
import { Card, Btn, Eyebrow } from "../components/UI";
import { Icon } from "../components/Characters";
import { Shell, TopBar, Progress, Timer, useTimer, ConfirmModal } from "../components/Layout";
import { useApp } from "../AppContext";
import { useFaceAnalysis } from "../components/useFaceAnalysis";

/* 브라우저 음성 인식 지원 여부 */
const SR = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function SpeakInterview() {
    const navigate = useNavigate();
    const { config, session, setFaceStats, setAnswers: setSessionAnswers, setTotalSec } = useApp();

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
    const [timerRunning, setTimerRunning] = useState(false);
    const [started, setStarted] = useState(false);
    const [sec, reset] = useTimer(timerRunning);
    const [showQuit, setShowQuit] = useState(false);
    const [showCamGuide, setShowCamGuide] = useState(true);
    const [noCam, setNoCam] = useState(false);
    const [showNoCamModal, setShowNoCamModal] = useState(false);
    const last = idx === total - 1;

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const recogRef = useRef(null);
    const finalRef = useRef("");
    const camIdRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const canvasRef = useRef(null);
    const faceCanvasRef = useRef(null);

    const { stats: faceStats, resetStats, detection } = useFaceAnalysis(videoRef, camReady, started);

    const startCamera = async () => {
        if (streamRef.current) return;
        try {
            if (!camIdRef.current) {
                const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                probe.getTracks().forEach((t) => t.stop());
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cams = devices.filter((d) => d.kind === "videoinput");
                const real = cams.find((c) => !/virtual|mirametrix|obs|snap/i.test(c.label)) || cams[0];
                camIdRef.current = real?.deviceId || null;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: camIdRef.current ? { deviceId: { exact: camIdRef.current } } : true,
                audio: true, // 마이크도 같이 요청 → 권한 팝업이 한 번에 뜸
            });
            streamRef.current = stream;
            setCamReady(true);
            attachStream();
        } catch (e) {
            setError(`카메라를 켤 수 없어요: ${e.name}`);
        }
    };

    const attachStream = () => {
        const v = videoRef.current;
        const s = streamRef.current;
        if (!v || !s) return;
        if (v.srcObject !== s) v.srcObject = s;
        v.play().catch(() => {});
    };

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setCamReady(false);
    };

    useEffect(() => { if (camReady) attachStream(); }, [camReady, idx, recording]);
    useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);
    useEffect(() => { resetStats(); }, []);

    // 카메라는 안내 모달에서 '시작하기'를 눌렀을 때 켜짐 (아래 showCamGuide onConfirm 참고)
    useEffect(() => {
        return () => stopCamera();
    }, []);

    useEffect(() => {
        const canvas = faceCanvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (detection) {
            const scaleX = canvas.width / video.videoWidth;
            const scaleY = canvas.height / video.videoHeight;
            const x = canvas.width - (detection.x + detection.width) * scaleX;
            const y = detection.y * scaleY;
            const w = detection.width * scaleX;
            const h = detection.height * scaleY;
            ctx.strokeStyle = "#46A578";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }
    }, [detection]);

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
        if (recording) { stop(); return; }
        setStarted(true);
        setTimerRunning(true);
        setError("");
        if (!SR) { setError("이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요."); return; }
        setRecording(true);
        if (!noCam) await startCamera();
        finalRef.current = texts[idx] || "";
        const r = buildRecognizer();
        if (!r) return;
        try {
            const audioStream = streamRef.current; // 이미 startCamera에서 받아둔 video+audio 스트림 재사용
            if (audioStream && audioStream.getAudioTracks().length > 0) {
                const ctx = new AudioContext();
                const source = ctx.createMediaStreamSource(audioStream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                audioCtxRef.current = ctx;
                analyserRef.current = analyser;
                drawWave();
            }
        } catch {}
        r._active = true;
        recogRef.current = r;
        try { r.start(); } catch {}
    };

    const drawWave = () => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;
        const ctx = canvas.getContext("2d");
        const data = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(data);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.strokeStyle = T.forest;
            ctx.lineWidth = 2;
            const sliceWidth = canvas.width / data.length;
            let x = 0;
            for (let i = 0; i < data.length; i++) {
                const v = data[i] / 128.0;
                const y = (v * canvas.height) / 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.stroke();
        };
        draw();
    };

    const stop = () => {
        if (recogRef.current) { recogRef.current._active = false; try { recogRef.current.stop(); } catch {} }
        // 카메라는 계속 켜둠 — 질문 넘어갈 때마다 재요청되지 않도록
        cancelAnimationFrame(animFrameRef.current);
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        analyserRef.current = null;
        setRecording(false);
        setInterim("");
        setFaceStats(faceStats);
        const r = [...recorded]; r[idx] = true; setRecorded(r);
    };

    const retake = () => {
        if (recogRef.current) { recogRef.current._active = false; try { recogRef.current.stop(); } catch {} }
        // 카메라는 계속 켜둠
        finalRef.current = "";
        setRecording(false);
        setInterim("");
        setTexts((prev) => { const a = [...prev]; a[idx] = ""; return a; });
        setRecorded((prev) => { const a = [...prev]; a[idx] = false; return a; });
        reset();
    };

    const next = () => {
        if (recogRef.current) { recogRef.current._active = false; try { recogRef.current.stop(); } catch {} }
        if (last) {
            stopCamera();
            setFaceStats(faceStats);
            setTotalSec(sec);
            setTimerRunning(false);
            setSessionAnswers(
                qList.map((q, i) => ({
                    questionId: q.id,
                    question: q.content,
                    answer: texts[i] || "",
                }))
            );
            navigate("/loading");
        } else {
            setIdx(idx + 1); setRecording(false); setInterim(""); finalRef.current = "";
        }
    };

    return (
        <Shell>
            <TopBar onQuit={() => setShowQuit(true)} />
            <ConfirmModal
                open={showCamGuide}
                title="카메라 · 마이크 권한 안내"
                desc="면접 진행을 위해 카메라와 마이크 접근 권한이 필요해요. 브라우저 팝업에서 '허용'을 눌러주세요."
                onConfirm={() => {
                    setShowCamGuide(false);
                    if (!noCam) startCamera(); // 여기서 실제 권한 요청 발생
                }}
                onCancel={() => navigate("/")}
                confirmText="시작하기"
                cancelText="돌아가기"
            />
            <ConfirmModal
                open={showQuit}
                title="면접을 중단할까요?"
                desc="지금 나가면 진행 중인 답변이 저장되지 않아요."
                onConfirm={() => { stopCamera(); navigate("/"); }}
                onCancel={() => setShowQuit(false)}
                confirmText="나가기"
                cancelText="계속 진행"
            />
            <ConfirmModal
                open={showNoCamModal}
                title="카메라 사용을 중단할까요?"
                desc="텍스트로 이어서 면접을 진행하시겠어요?"
                confirmText="확인"
                cancelText="취소"
                onConfirm={() => {
                    setNoCam(true);
                    setTimerRunning(true);
                    setShowNoCamModal(false);
                }}
                onCancel={() => {
                    startCamera();
                    setTimerRunning(true);
                    setShowNoCamModal(false);
                }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 18px" }}>
                <span style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600 }}>{config?.job} · {config?.qtype}</span>
                <Timer sec={sec} />
            </div>
            <Progress idx={idx} />

            {/* ── 여기부터 원래처럼 전부 하나의 Card 안에 ── */}
            <Card style={{ marginTop: 22, padding: 30, textAlign: "center" }}>
                {!started ? (
                    <p style={{ fontSize: 15, color: T.inkSoft, margin: "20px 0" }}>
                        카메라 허용 후 녹음을 시작하면 면접이 시작됩니다.
                    </p>
                ) : (
                    <>
                        <Eyebrow>Question {String(idx + 1).padStart(2, "0")}</Eyebrow>
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1.45, letterSpacing: "-0.02em", margin: "10px 0 26px" }}>
                            {questions[idx]}
                        </h2>
                    </>
                )}

                {/* 카메라 프리뷰 */}
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
                    <canvas
                        ref={faceCanvasRef}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
                    />
                    {!camReady && (
                        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", gap: 6, gridAutoFlow: "row", zIndex: 1 }}>
                            <Icon.cam size={28} />
                            <span style={{ fontSize: 12.5 }}>카메라 · 마이크 미리보기</span>
                        </div>
                    )}
                    {recording && !detection && camReady && (
                        <div style={{
                            position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", zIndex: 2,
                            background: "rgba(251, 128, 58, 0.85)", color: "#fff", fontSize: 11.5, fontWeight: 700,
                            padding: "4px 12px", borderRadius: 20,
                        }}>
                            얼굴이 감지되지 않아요
                        </div>
                    )}
                    {recording && (
                        <span style={{
                            position: "absolute", top: 10, left: 10, zIndex: 2, display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 9px", borderRadius: 20, background: "rgba(181,80,58,.92)", color: "#fff", fontSize: 11.5, fontWeight: 700,
                        }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} /> REC
                        </span>
                    )}
                    {recording && (
                        <span style={{
                            position: "absolute", top: 10, right: 10, zIndex: 2, display: "inline-flex", alignItems: "center", gap: 8,
                            padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,.45)", color: "#fff", fontSize: 11, fontWeight: 600,
                        }}>
                            <span>😊 {faceStats.smiles}회</span>
                            <span style={{ color: detection ? "#7FCBA4" : "#F87171" }}>{detection ? "👁 응시 중" : "👁 이탈"}</span>
                            <span> {faceStats.gazeRate}%</span>
                        </span>
                    )}
                </div>

                {/* 파형 시각화 */}
                {recording && (
                    <canvas
                        ref={canvasRef}
                        width={380}
                        height={60}
                        style={{ width: "100%", maxWidth: 380, borderRadius: 8, background: T.mist, marginBottom: 12 }}
                    />
                )}

                {/* 카메라 사용 안 함 토글 */}
                <div style={{ marginBottom: 14 }}>
                    <button
                        onClick={() => {
                            if (noCam) {
                                setNoCam(false);
                                startCamera();
                            } else {
                                setTimerRunning(false);
                                stopCamera();
                                setShowNoCamModal(true);
                            }
                        }}
                        style={{
                            fontSize: 12.5, color: noCam ? T.forest : T.inkSoft,
                            background: "none", border: "none", cursor: "pointer",
                            fontFamily: "inherit", textDecoration: "underline",
                        }}
                    >
                        {noCam ? "📷 카메라 사용하기" : "카메라 사용 안 함"}
                    </button>
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

                {started && (
                    <p style={{ fontSize: 13, color: T.inkSoft, margin: "12px 0 0" }}>
                        {recording ? "녹음 중 · 다시 누르면 중지" : recorded[idx] ? "답변이 녹음되었어요" : "버튼을 눌러 답변을 시작하세요"}
                    </p>
                )}

                {error && (
                    <p style={{ fontSize: 12.5, color: "#B5503A", margin: "10px 0 0", fontWeight: 600 }}>{error}</p>
                )}

                {/* 인식된 한글 텍스트 — 수정 가능, 항상 표시 */}
                <div style={{
                    marginTop: 18, padding: 16, borderRadius: 11,
                    background: T.bg, border: `1px solid ${T.line}`, textAlign: "left",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.inkSoft, letterSpacing: "0.02em" }}>인식된 답변</span>
                        <span style={{ fontSize: 11, color: T.inkFaint }}>직접 수정할 수 있어요</span>
                    </div>
                    <textarea
                        value={texts[idx]}
                        onChange={(e) => {
                            const v = e.target.value;
                            finalRef.current = v;
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
                    {recording && interim && (
                        <p style={{ fontSize: 13, color: T.inkSoft, margin: "8px 2px 0", fontStyle: "italic" }}>
                            … {interim}
                        </p>
                    )}
                </div>

                {started && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
                        <Btn variant="outline" onClick={retake}>다시 녹음</Btn>
                        <Btn variant={last ? "accent" : "primary"} disabled={!recorded[idx]} onClick={next}>
                            {last ? <>제출하기 <Icon.check size={18} /></> : <>다음 <Icon.arrow size={18} /></>}
                        </Btn>
                    </div>
                )}
            </Card>
        </Shell>
    );
}
